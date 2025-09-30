import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Local helper to create a scoped notification
// audience: { users?: number[], roles?: string[], departments?: number[], visibleToAll?: boolean }
const createNotification = async (title, message, type, relatedDocId = null, audience = {}) => {
  try {
    const visibleToAll = audience?.visibleToAll ? 1 : 0;
    const [res] = await db.promise().query(
      'INSERT INTO notifications (title, message, type, visible_to_all, related_doc_id) VALUES (?, ?, ?, ?, ?)',
      [title, message, type, visibleToAll, relatedDocId]
    );
    const notificationId = res.insertId;
    if (visibleToAll === 1) return notificationId;

    const depts = Array.isArray(audience?.departments) ? audience.departments.filter(Boolean) : [];
    const roles = Array.isArray(audience?.roles) ? audience.roles.map(r => String(r).toUpperCase()).filter(Boolean) : [];
    const users = Array.isArray(audience?.users) ? audience.users.map(u => Number(u)).filter(Boolean) : [];

    if (depts.length > 0) {
      const values = depts.flatMap(d => [notificationId, d]);
      const placeholders = depts.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_departments (notification_id, department_id) VALUES ${placeholders}`, values);
    }
    if (roles.length > 0) {
      const values = roles.flatMap(r => [notificationId, r]);
      const placeholders = roles.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_roles (notification_id, role) VALUES ${placeholders}`, values);
    }
    if (users.length > 0) {
      const values = users.flatMap(u => [notificationId, u]);
      const placeholders = users.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_users (notification_id, user_id) VALUES ${placeholders}`, values);
    }

    return notificationId;
  } catch (e) {
    console.error('Error creating notification (RequestsAPI):', e);
    return null;
  }
};

// Get documents that have action requirements for the current user/department/role
router.get('/documents/requests', requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser?.id || req.currentUser?.user_id || null;
    const deptId = req.currentUser?.department_id || null;
    const roleUpper = (req.currentUser?.role || '').toString().toUpperCase();
    const scope = (req.query.scope || 'assigned').toString().toLowerCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';

    // Base SQL selects documents that have any action rows (including completed ones)
    let sql = `
      SELECT 
        d.doc_id AS id,
        d.title,
        d.reference,
        dt.name AS doc_type,
        d.date_received,
        d.google_drive_link,
        d.available_copy,
        d.created_by_name,
        creator.profile_pic AS created_by_profile_pic,
        GROUP_CONCAT(DISTINCT ar.action_name ORDER BY ar.action_name SEPARATOR ', ') AS action_required_names,
        da.status AS action_status,
        da.completed_at,
        da.completed_by_user_id,
        CONCAT(completed_user.firstname, ' ', completed_user.lastname) AS completed_by_name,
        reply_doc.doc_id AS reply_doc_id,
        reply_doc.title AS reply_title,
        reply_doc.description AS reply_description,
        reply_doc.google_drive_link AS reply_google_drive_link,
        reply_doc.created_at AS reply_created_at
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      INNER JOIN document_actions da ON da.doc_id = d.doc_id
      LEFT JOIN action_required ar ON ar.action_id = da.action_id
      LEFT JOIN document_departments dd ON dd.doc_id = d.doc_id
      LEFT JOIN dms_user creator ON creator.Username = d.created_by_name OR CONCAT(creator.firstname, ' ', creator.lastname) = d.created_by_name
      LEFT JOIN dms_user completed_user ON da.completed_by_user_id = completed_user.user_id
      LEFT JOIN dms_documents reply_doc ON reply_doc.is_reply_to_doc_id = d.doc_id
      WHERE (d.deleted IS NULL OR d.deleted = 0)
    `;

    const params = [];

    if (!isAdmin) {
      if (scope === 'dept') {
        // Department overview: include items tied to their department, their role, or in their department, or public
        sql += ` AND (
            (da.assigned_to_department_id IS NOT NULL AND da.assigned_to_department_id = ?)
            OR (da.assigned_to_role IS NOT NULL AND da.assigned_to_role = ?)
            OR (dd.department_id IS NOT NULL AND dd.department_id = ?)
            OR (d.visible_to_all = 1)
          )`;
        params.push(deptId, roleUpper, deptId);
      } else {
        // Assigned-only view (default)
        sql += ` AND (
            (da.assigned_to_user_id IS NOT NULL AND da.assigned_to_user_id = ?)
            OR (da.assigned_to_department_id IS NOT NULL AND da.assigned_to_department_id = ?)
            OR (da.assigned_to_role IS NOT NULL AND da.assigned_to_role = ?)
          )`;
        params.push(userId, deptId, roleUpper);
      }
    }

    sql += `
      GROUP BY d.doc_id
      ORDER BY d.created_at DESC
    `;

    const [rows] = await db.promise().query(sql, params);

    const documents = rows.map(r => ({
      id: r.id,
      title: r.title,
      reference: r.reference,
      doc_type: r.doc_type,
      date_received: r.date_received,
      google_drive_link: r.google_drive_link,
      available_copy: r.available_copy || 'soft_copy',
      created_by_name: r.created_by_name,
      created_by_profile_pic: r.created_by_profile_pic,
      action_required: r.action_required_names ? r.action_required_names.split(', ').filter(Boolean) : [],
      action_status: r.action_status,
      completed_at: r.completed_at,
      completed_by_user_id: r.completed_by_user_id,
      completed_by_name: r.completed_by_name,
      reply_title: r.reply_title,
      reply_description: r.reply_description,
      reply_google_drive_link: r.reply_google_drive_link,
      reply_created_at: r.reply_created_at,
      // For backward compatibility
      action_required_name: r.action_required_names ? r.action_required_names.split(', ')[0] : null
    }));

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching request documents:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Upload reply to action-required document
router.post('/documents/reply', requireAuth, async (req, res) => {
  try {
    const { original_doc_id, title, description, google_drive_link, reply_type } = req.body;
    const userId = req.currentUser?.id || req.currentUser?.user_id;

    if (!original_doc_id || !title || !google_drive_link) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate Google Drive link
    const drivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view/,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\/edit/
    ];
    
    if (!drivePatterns.some(pattern => pattern.test(google_drive_link))) {
      return res.status(400).json({ success: false, message: 'Invalid Google Drive link format' });
    }

    // Get current user's name
    const [userResults] = await db.promise().query(
      'SELECT firstname, lastname FROM dms_user WHERE user_id = ?',
      [userId]
    );
    const userName = userResults.length > 0 
      ? `${userResults[0].firstname || ''} ${userResults[0].lastname || ''}`.trim()
      : 'Unknown User';

    // Resolve document type id for "Reply" to satisfy FK constraint
    let replyTypeId = null;
    try {
      const [typeRows] = await db.promise().query(
        'SELECT type_id FROM document_types WHERE UPPER(name) = UPPER(?) LIMIT 1',
        ['Reply']
      );
      if (Array.isArray(typeRows) && typeRows.length > 0) {
        replyTypeId = typeRows[0].type_id;
      } else {
        // Fallback: pick first available type to avoid FK error (optional)
        const [anyType] = await db.promise().query('SELECT type_id FROM document_types LIMIT 1');
        if (Array.isArray(anyType) && anyType.length > 0) replyTypeId = anyType[0].type_id;
      }
    } catch (_) {
      // ignore – let insert fail if FK still not satisfied
    }

    // Insert reply document
    const [result] = await db.promise().query(
      `INSERT INTO dms_documents 
       (title, reference, from_field, to_field, date_received, google_drive_link, description, 
        available_copy, doc_type, created_by_user_id, created_by_name, is_reply_to_doc_id, reply_type)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'soft_copy', ?, ?, ?, ?, ?)`,
      [
        title,
        `REPLY-${Date.now()}`, // Auto-generated reference
        userName, // From current user
        'System', // To system
        google_drive_link,
        description || '',
        replyTypeId, // must reference document_types.type_id
        userId,
        userName,
        original_doc_id,
        reply_type || 'action_response'
      ]
    );

    const replyDocId = result.insertId;

    // Update action status to 'completed' for the original document
    await db.promise().query(
      `UPDATE document_actions 
       SET status = 'completed', 
           completed_at = NOW(),
           completed_by_user_id = ?
       WHERE doc_id = ? AND status = 'pending'`,
      [userId, original_doc_id]
    );

    // Create a targeted 'replied' notification for the original doc creator and assignees
    try {
      const notifTitle = `Reply Added: ${title}`;
      const notifMsg = `${userName} replied to your request "${title}".`;

      // Build audience from original doc creator and all assignments
      const audience = { users: [], roles: [], departments: [] };
      
      // Always include ADMIN role for reply notifications
      audience.roles.push('ADMIN');
      
      try {
        const [origDocRows] = await db.promise().query(
          `SELECT d.created_by_user_id, d.created_by_name, dd.department_id
           FROM dms_documents d
           LEFT JOIN document_departments dd ON dd.doc_id = d.doc_id
           WHERE d.doc_id = ?`,
          [original_doc_id]
        );
        if (Array.isArray(origDocRows) && origDocRows.length > 0) {
          origDocRows.forEach(r => {
            if (r.created_by_user_id) audience.users.push(r.created_by_user_id);
            if (r.department_id) audience.departments.push(r.department_id);
          });
        }
      } catch (_) {}

      try {
        const [assignRows] = await db.promise().query(
          `SELECT assigned_to_user_id, assigned_to_role, assigned_to_department_id
           FROM document_actions WHERE doc_id = ?`,
          [original_doc_id]
        );
        if (Array.isArray(assignRows)) {
          for (const a of assignRows) {
            if (a?.assigned_to_user_id) audience.users.push(Number(a.assigned_to_user_id));
            if (a?.assigned_to_role) audience.roles.push(String(a.assigned_to_role).toUpperCase());
            if (a?.assigned_to_department_id) audience.departments.push(Number(a.assigned_to_department_id));
          }
        }
      } catch (_) {}

      // Deduplicate
      audience.users = Array.from(new Set(audience.users.filter(Boolean)));
      audience.roles = Array.from(new Set(audience.roles.filter(Boolean)));
      audience.departments = Array.from(new Set(audience.departments.filter(Boolean)));

      // Debug logging
      console.log('Reply notification audience:', {
        users: audience.users,
        roles: audience.roles,
        departments: audience.departments,
        original_doc_id,
        title,
        userName
      });

      await createNotification(notifTitle, notifMsg, 'replied', original_doc_id, audience);

      // Emit to audience rooms
      const payload = {
        title: notifTitle,
        message: notifMsg,
        type: 'replied',
        related_doc_id: original_doc_id,
        created_at: new Date().toISOString()
      };
      for (const uid of audience.users) req?.io?.to(`user:${uid}`).emit('notification:new', payload);
      for (const r of audience.roles) req?.io?.to(`role:${r}`).emit('notification:new', payload);
      for (const d of audience.departments) req?.io?.to(`dept:${d}`).emit('notification:new', payload);
    } catch (e) {
      console.error('Failed to create replied notification:', e);
    }

    res.json({ 
      success: true, 
      message: 'Reply uploaded successfully',
      reply_doc_id: replyDocId
    });

  } catch (error) {
    console.error('Error uploading reply:', error);
    res.status(500).json({ success: false, message: 'Error uploading reply' });
  }
});

// Get answered/completed documents for current user
router.get('/documents/answered', requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser?.id || req.currentUser?.user_id || null;
    const deptId = req.currentUser?.department_id || null;
    const roleUpper = (req.currentUser?.role || '').toString().toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';

    // Query to get documents with completed actions and their replies
    let sql = `
      SELECT 
        d.doc_id AS id,
        d.title,
        d.reference,
        dt.name AS doc_type,
        d.date_received,
        d.google_drive_link,
        d.available_copy,
        d.created_by_name,
        GROUP_CONCAT(DISTINCT ar.action_name ORDER BY ar.action_name SEPARATOR ', ') AS action_required_names,
        da.completed_at,
        da.completed_by_user_id,
        CONCAT(completed_user.firstname, ' ', completed_user.lastname) AS completed_by_name,
        reply_doc.doc_id AS reply_doc_id,
        reply_doc.title AS reply_title,
        reply_doc.description AS reply_description,
        reply_doc.google_drive_link AS reply_google_drive_link,
        reply_doc.created_at AS reply_created_at
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      INNER JOIN document_actions da ON da.doc_id = d.doc_id
      LEFT JOIN action_required ar ON ar.action_id = da.action_id
      LEFT JOIN dms_user completed_user ON da.completed_by_user_id = completed_user.user_id
      LEFT JOIN dms_documents reply_doc ON reply_doc.is_reply_to_doc_id = d.doc_id
      LEFT JOIN document_departments dd ON dd.doc_id = d.doc_id
      WHERE da.status = 'completed'
        AND (d.deleted IS NULL OR d.deleted = 0)
    `;

    const params = [];

    if (!isAdmin) {
      // For non-admins, show only documents they completed or were assigned to them
      sql += ` AND (
          (da.completed_by_user_id IS NOT NULL AND da.completed_by_user_id = ?)
          OR (da.assigned_to_user_id IS NOT NULL AND da.assigned_to_user_id = ?)
          OR (da.assigned_to_department_id IS NOT NULL AND da.assigned_to_department_id = ?)
          OR (da.assigned_to_role IS NOT NULL AND da.assigned_to_role = ?)
        )`;
      params.push(userId, userId, deptId, roleUpper);
    }

    sql += `
      GROUP BY d.doc_id, reply_doc.doc_id
      ORDER BY da.completed_at DESC
    `;

    const [rows] = await db.promise().query(sql, params);

    // Group by original document and collect replies
    const documentMap = new Map();
    
    rows.forEach(row => {
      const docId = row.id;
      if (!documentMap.has(docId)) {
        documentMap.set(docId, {
          id: row.id,
          title: row.title,
          reference: row.reference,
          doc_type: row.doc_type,
          date_received: row.date_received,
          google_drive_link: row.google_drive_link,
          available_copy: row.available_copy || 'soft_copy',
          created_by_name: row.created_by_name,
          action_required: row.action_required_names ? row.action_required_names.split(', ').filter(Boolean) : [],
          completed_at: row.completed_at,
          completed_by_user_id: row.completed_by_user_id,
          completed_by_name: row.completed_by_name,
          replies: []
        });
      }
      
      // Add reply if exists
      if (row.reply_doc_id) {
        const existingReply = documentMap.get(docId).replies.find(r => r.id === row.reply_doc_id);
        if (!existingReply) {
          documentMap.get(docId).replies.push({
            id: row.reply_doc_id,
            title: row.reply_title,
            description: row.reply_description,
            google_drive_link: row.reply_google_drive_link,
            created_at: row.reply_created_at
          });
        }
      }
    });

    // Convert to array and add reply info to main document
    const documents = Array.from(documentMap.values()).map(doc => {
      const latestReply = doc.replies.length > 0 ? doc.replies[0] : null;
      return {
        ...doc,
        reply_title: latestReply?.title || null,
        reply_description: latestReply?.description || null,
        reply_google_drive_link: latestReply?.google_drive_link || null,
        reply_created_at: latestReply?.created_at || null,
        replies: doc.replies // Keep full replies array for future use
      };
    });

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching answered documents:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

export default router;
