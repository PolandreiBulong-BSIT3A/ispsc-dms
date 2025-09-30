import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

// Ensure join table for multi-folder support exists
const ensureDocumentFoldersTable = async () => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS document_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_id INT NOT NULL,
        folder_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_doc (doc_id),
        KEY idx_folder (folder_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn('ensureDocumentFoldersTable failed:', e?.message || e);
  }
};
ensureDocumentFoldersTable();

const router = express.Router();

const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();
const isDeanRole = (role) => normalizeRole(role) === 'dean';

// Local helper to create a notification (scoped)
// audience: { visibleToAll?: boolean, departments?: number[], roles?: string[], users?: (number|string)[] }
const createNotification = async (title, message, type, relatedDocId = null, audience = {}) => {
  try {
    const visibleToAll = audience?.visibleToAll ? 1 : 0;
    const [res] = await db.promise().query(
      'INSERT INTO notifications (title, message, type, visible_to_all, related_doc_id) VALUES (?, ?, ?, ?, ?)',
      [title, message, type, visibleToAll, relatedDocId]
    );
    const notificationId = res.insertId;

    if (visibleToAll === 1) return notificationId;

    // Insert scoped audiences
    const depts = Array.isArray(audience?.departments) ? audience.departments.filter(Boolean) : [];
    const roles = Array.isArray(audience?.roles) ? audience.roles.map(r => String(r).toUpperCase()).filter(Boolean) : [];
    const users = Array.isArray(audience?.users) ? audience.users.map(u => Number(u)).filter(Boolean) : [];

    if (depts.length > 0) {
      const values = depts.flatMap(d => [notificationId, d]);
      const placeholders = depts.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_departments (notification_id, department_id) VALUES ${placeholders}` , values);
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
    console.error('Error creating notification:', e);
    return null;
  }
};

// Get latest documents (for dashboard)
router.get('/documents/latest', requireAuth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const current = req.currentUser || {};
    const dean = isDeanRole(current.role);
    const roleLower = (current.role || '').toString().trim().toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'administrator';

    const filters = [];
    const values = [];

    // Exclude soft-deleted
    filters.push('COALESCE(d.deleted, 0) = 0');

    // Visibility
    if (isAdmin) {
      // no additional filter
    } else if (dean && current.department_id) {
      // Dean: public OR department OR explicitly allowed (user/role)
      filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (dd.department_id = ?) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
      values.push(current.department_id);
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
    } else {
      // Non-admin non-dean: public OR dept (if any) OR explicitly allowed (user/role)
      if (current?.department_id) {
        filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (dd.department_id = ?) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
        values.push(current.department_id);
      } else {
        filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
      }
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
    }

    // For ALL users, exclude documents that have action requirements OR are replies to action-required documents
    filters.push(`d.doc_id NOT IN (
      SELECT DISTINCT da.doc_id 
      FROM document_actions da 
      WHERE da.doc_id IS NOT NULL
    ) AND d.is_reply_to_doc_id IS NULL`);
    
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        d.title,
        d.reference,
        d.status,
        d.created_at,
        d.created_by_name,
        d.allowed_user_ids,
        d.allowed_roles,
        dt.name AS doc_type,
        u.profile_pic AS created_by_profile_pic,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY f2.name SEPARATOR ', ') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name
      ${whereClause}
      GROUP BY d.doc_id
      ORDER BY d.created_at DESC 
      LIMIT ?
    `;
    
    values.push(parseInt(limit));
    const [results] = await db.promise().query(sql, values);
    
    res.json({ success: true, documents: results });

// Visibility info for a specific document
// Returns a normalized shape used by the frontend:
// { visible_to_all: boolean, department_ids: number[], user_ids: number[], roles: string[] }
router.get('/documents/:id/visibility', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch base document
    const [docs] = await db.promise().query(
      'SELECT visible_to_all, allowed_user_ids, allowed_roles FROM dms_documents WHERE doc_id = ? LIMIT 1',
      [id]
    );
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const d = docs[0];

    // Departments
    const [deptRows] = await db.promise().query(
      'SELECT department_id FROM document_departments WHERE doc_id = ?',
      [id]
    );
    const department_ids = Array.isArray(deptRows)
      ? deptRows.map(r => Number(r.department_id)).filter(Boolean)
      : [];

    // Users (CSV -> array of numbers)
    const user_ids = (d.allowed_user_ids || '')
      .toString()
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(Boolean);

    // Roles (CSV -> array uppercase)
    const roles = (d.allowed_roles || '')
      .toString()
      .split(',')
      .map(s => String(s).trim().toUpperCase())
      .filter(Boolean);

    return res.json({
      success: true,
      visibility: {
        visible_to_all: d.visible_to_all === 1 || d.visible_to_all === true,
        department_ids,
        user_ids,
        roles,
      }
    });
  } catch (error) {
    console.error('Error fetching document visibility:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});

// Get a single document by ID (for edit screen prefill)
router.get('/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        dt.name AS doc_type,
        f.name AS folder,
        d.reference,
        d.title,
        d.revision,
        d.rev_date,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.available_copy,
        d.visible_to_all,
        d.allowed_user_ids,
        d.allowed_roles,
        d.status,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        u.profile_pic AS created_by_profile_pic,
        GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
        GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY f2.name SEPARATOR ', ') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name
      WHERE d.doc_id = ?
      GROUP BY d.doc_id
    `;
    const [rows] = await db.promise().query(sql, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Document not found' });
    const r = rows[0];
    const document = {
      id: r.id,
      doc_type: r.doc_type || '',
      folder: r.folder || '',
      reference: r.reference || '',
      title: r.title || '',
      revision: r.revision || '',
      rev_date: r.rev_date || null,
      from_field: r.from_field || '',
      to_field: r.to_field || '',
      date_received: r.date_received || null,
      google_drive_link: r.google_drive_link || '',
      description: r.description || '',
      available_copy: r.available_copy || 'soft_copy',
      visible_to_all: r.visible_to_all,
      allowed_user_ids: r.allowed_user_ids || '',
      allowed_roles: r.allowed_roles || '',
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by_name: r.created_by_name,
      created_by_profile_pic: r.created_by_profile_pic,
      department_names: r.department_names || '',
      department_ids: r.department_ids || '',
      folder_names: r.folder_names || '',
      folder_ids: r.folder_ids || ''
    };
    return res.json({ success: true, document });
  } catch (error) {
    console.error('Error fetching document by id:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});
  } catch (error) {
    console.error('Error fetching latest documents:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// List documents
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const current = req.currentUser || {};
    const dean = isDeanRole(current.role);
    const roleLower = (current.role || '').toString().trim().toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'administrator';

    const filters = [];
    const values = [];

    // Exclude soft-deleted
    filters.push('COALESCE(d.deleted, 0) = 0');

    // Visibility
    if (isAdmin) {
      // no restriction
    } else if (dean && current.department_id) {
      filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (dd.department_id = ?) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
      values.push(current.department_id);
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
    } else {
      if (current?.department_id) {
        filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (dd.department_id = ?) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
        values.push(current.department_id);
      } else {
        filters.push('((COALESCE(d.visible_to_all, 0) = 1) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0))');
      }
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
    }

    // Exclude action-required documents or replies (reserved for Requests page)
    filters.push(`d.doc_id NOT IN (
      SELECT DISTINCT da.doc_id 
      FROM document_actions da 
      WHERE da.doc_id IS NOT NULL
    ) AND d.is_reply_to_doc_id IS NULL`);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        dt.name AS doc_type,
        f.name AS folder,
        d.reference,
        d.title,
        d.revision,
        d.rev_date,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.available_copy,
        d.visible_to_all,
        d.allowed_user_ids,
        d.allowed_roles,
        d.status,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        u.profile_pic AS created_by_profile_pic,
        GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
        GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY f2.name SEPARATOR ', ') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name
      ${whereClause}
      GROUP BY d.doc_id
      ORDER BY d.created_at DESC
    `;
    
    const [results] = await db.promise().query(sql, values);
    
    const documents = results.map(r => ({
      id: r.id,
      doc_type: r.doc_type || '',
      folder: r.folder || '',
      reference: r.reference || '',
      title: r.title || '',
      revision: r.revision || '',
      rev_date: r.rev_date || null,
      from_field: r.from_field || '',
      to_field: r.to_field || '',
      date_received: r.date_received || null,
      google_drive_link: r.google_drive_link || '',
      description: r.description || '',
      available_copy: r.available_copy || 'soft_copy',
      visible_to_all: r.visible_to_all,
      allowed_user_ids: r.allowed_user_ids || '',
      allowed_roles: r.allowed_roles || '',
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by_name: r.created_by_name,
      created_by_profile_pic: r.created_by_profile_pic,
      department_names: r.department_names || '',
      department_ids: r.department_ids || '',
      folder_names: r.folder_names || '',
      folder_ids: r.folder_ids || ''
    }));
    
    return res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});

// Distinct From/To values for current user (most-recent-first)
router.get('/documents/distinct-from-to', requireAuth, async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const current = req.currentUser || {};
    const possibleCreators = [];
    if (current?.username) possibleCreators.push(current.username);
    const fullName = `${current?.firstname || ''} ${current?.lastname || ''}`.trim();
    if (fullName) possibleCreators.push(fullName);

    const where = possibleCreators.length > 0
      ? `WHERE COALESCE(d.deleted, 0) = 0 AND d.created_by_name IN (${possibleCreators.map(() => '?').join(',')})`
      : 'WHERE COALESCE(d.deleted, 0) = 0';

    const sql = `
      SELECT d.from_field, d.to_field, d.created_at
      FROM dms_documents d
      ${where}
      ORDER BY d.created_at DESC
      LIMIT ?
    `;
    const values = [...possibleCreators, parseInt(limit)];
    const [rows] = await db.promise().query(sql, values);

    // Build distinct lists preserving order
    const seenFrom = new Set();
    const seenTo = new Set();
    const from_values = [];
    const to_values = [];
    for (const r of rows) {
      const f = (r.from_field || '').trim();
      const t = (r.to_field || '').trim();
      if (f && !seenFrom.has(f.toLowerCase())) { seenFrom.add(f.toLowerCase()); from_values.push(f); }
      if (t && !seenTo.has(t.toLowerCase())) { seenTo.add(t.toLowerCase()); to_values.push(t); }
      if (from_values.length >= 50 && to_values.length >= 50) break; // hard cap to keep payload small
    }

    return res.json({ success: true, from_values, to_values });
  } catch (error) {
    console.error('Error fetching distinct from/to:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});

export default router;
 
// Create document
router.post('/documents', requireAuth, async (req, res) => {
  try {
    const {
      category,
      folder,
      folder_ids: folderIdsInput = [],
      reference,
      title,
      revision,
      rev_date,
      from_field,
      to_field,
      date_received,
      google_drive_link,
      description,
      available_copy,
      visible_to_all,
      allowed_user_ids: allowedUserIdsInput = [],
      allowed_roles: allowedRolesInput = [],
      departmentIds = [],
      actionRequired = [],
      actionAssignments = []
    } = req.body || {};

    const toTitleCase = (s) => {
      if (!s) return '';
      return String(s)
        .toLowerCase()
        .replace(/\b([a-z])/g, (m, p1) => p1.toUpperCase());
    };

    const resolvedRevDate = rev_date || null;
    const resolvedFrom = from_field ? toTitleCase(from_field) : null;
    const resolvedTo = to_field ? toTitleCase(to_field) : null;
    const resolvedDateReceived = date_received || null;
    const visibleToAll = visible_to_all ? 1 : 0;
    const resolvedCategory = toTitleCase((category || '').trim());
    const resolvedFolder = toTitleCase((folder || '').trim());
    const resolvedTitle = toTitleCase((title || '').trim());

    // Normalize allowed lists to CSV strings
    const toCsv = (v) => {
      if (!v) return '';
      if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean).join(',');
      return String(v).split(',').map(s => s.trim()).filter(Boolean).join(',');
    };
    const allowedUserIdsCsv = toCsv(allowedUserIdsInput);
    const allowedRolesCsv = toCsv(allowedRolesInput).toLowerCase().replace(/\s+/g, '');

    const insertDoc = async (docTypeId, folderId) => {
      const sql = `INSERT INTO dms_documents 
        (doc_type, folder_id, reference, title, revision, rev_date, from_field, to_field, date_received, google_drive_link, description, available_copy, visible_to_all, allowed_user_ids, allowed_roles, created_by_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        docTypeId || null,
        folderId || null,
        reference || null,
        resolvedTitle,
        revision || null,
        resolvedRevDate || null,
        resolvedFrom || null,
        resolvedTo || null,
        resolvedDateReceived || null,
        google_drive_link || null,
        description || null,
        available_copy || 'soft_copy',
        visibleToAll,
        allowedUserIdsCsv || null,
        allowedRolesCsv || null,
        req.currentUser?.username || `${req.currentUser?.firstname || ''} ${req.currentUser?.lastname || ''}`.trim() || 'Unknown User',
        'active'
      ];

      try {
        const [result] = await db.promise().query(sql, values);
        const newId = result.insertId;

        // Assign departments
        if (Array.isArray(departmentIds) && departmentIds.length > 0) {
          for (const deptId of departmentIds) {
            await db.promise().query(
              'INSERT INTO document_departments (doc_id, department_id) VALUES (?, ?)',
              [newId, deptId]
            );
          }
        }

        // Assign folders into join table (multi-folder support)
        try {
          const folderIds = Array.isArray(folderIdsInput) ? folderIdsInput.map(Number).filter(Boolean) : [];
          if (folderIds.length > 0) {
            for (const fid of folderIds) {
              await db.promise().query('INSERT INTO document_folders (doc_id, folder_id) VALUES (?, ?)', [newId, fid]);
            }
          } else if (folderId) {
            await db.promise().query('INSERT INTO document_folders (doc_id, folder_id) VALUES (?, ?)', [newId, folderId]);
          }
        } catch {}

        // Insert document_actions
        const actionIds = Array.isArray(actionRequired) ? actionRequired.filter(a => !!a) : [];
        const assignments = Array.isArray(actionAssignments) ? actionAssignments : [];
        if (assignments.length > 0) {
          for (const a of assignments) {
            await db.promise().query(
              `INSERT INTO document_actions (doc_id, action_id, assigned_to_user_id, assigned_to_role, assigned_to_department_id, status, created_by_user_id)
               VALUES (?, ?, ?, ?, ?, "pending", ?)`,
              [newId, a.action_id, a.assigned_to_user_id || null, a.assigned_to_role || null, a.assigned_to_department_id || null, req.currentUser?.id || null]
            );
          }
        } else if (actionIds.length > 0) {
          for (const actionId of actionIds) {
            await db.promise().query(
              'INSERT INTO document_actions (doc_id, action_id, status, created_by_user_id) VALUES (?, ?, "pending", ?)',
              [newId, actionId, req.currentUser?.id || null]
            );
          }
        }

        // Notification - Create single, appropriate notification based on document type
        const hasAssignments = Array.isArray(assignments) && assignments.length > 0;
        const userName = req.currentUser?.username || `${req.currentUser?.firstname || ''} ${req.currentUser?.lastname || ''}`.trim() || 'User';
        
        if (hasAssignments) {
          // For documents with assignments, create a single "Request Added" notification targeted to assignees
          const reqAudience = { users: [], roles: [], departments: [] };
          for (const a of assignments) {
            if (a?.assigned_to_user_id) reqAudience.users.push(Number(a.assigned_to_user_id));
            if (a?.assigned_to_role) reqAudience.roles.push(String(a.assigned_to_role).toUpperCase());
            if (a?.assigned_to_department_id) reqAudience.departments.push(Number(a.assigned_to_department_id));
          }
          reqAudience.users = Array.from(new Set(reqAudience.users.filter(Boolean)));
          reqAudience.roles = Array.from(new Set(reqAudience.roles.filter(Boolean)));
          reqAudience.departments = Array.from(new Set(reqAudience.departments.filter(Boolean)));
          
          const requestTitle = `Request Added: ${title}`;
          const requestMessage = `You have a new request "${title}" from ${userName}`;
          await createNotification(requestTitle, requestMessage, 'requested', newId, reqAudience);
          
          // Emit targeted socket events for 'requested'
          try {
            const reqPayload = {
              title: requestTitle,
              message: requestMessage,
              type: 'requested',
              related_doc_id: newId,
              created_at: new Date().toISOString()
            };
            for (const uid of reqAudience.users) {
              req?.io?.to(`user:${uid}`).emit('notification:new', reqPayload);
            }
            for (const r of reqAudience.roles) {
              req?.io?.to(`role:${r}`).emit('notification:new', reqPayload);
            }
            for (const dpt of reqAudience.departments) {
              req?.io?.to(`dept:${dpt}`).emit('notification:new', reqPayload);
            }
          } catch (e) {
            console.warn('Socket emit failed (notification:new requested):', e?.message || e);
          }
        } else {
          // For regular documents, create a general "New Document Added" notification
          const parseCsv = (csv) => (csv ? String(csv).split(',').map(s => s.trim()).filter(Boolean) : []);
          const audience = {
            visibleToAll: visibleToAll === 1,
            departments: Array.isArray(departmentIds) ? departmentIds.filter(Boolean).map(Number) : [],
            roles: parseCsv(allowedRolesCsv).map(r => r.toUpperCase()),
            users: parseCsv(allowedUserIdsCsv).map(n => Number(n))
          };
          // Deduplicate arrays
          audience.users = Array.from(new Set(audience.users.filter(Boolean)));
          audience.roles = Array.from(new Set(audience.roles.filter(Boolean)));
          audience.departments = Array.from(new Set(audience.departments.filter(Boolean)));
          
          const notificationTitle = `New Document Added: ${title}`;
          const notificationMessage = `A new document "${title}" has been uploaded by ${userName}`;
          await createNotification(notificationTitle, notificationMessage, 'added', newId, audience);
          
          // For regular documents, also emit socket events to the appropriate audience
          try {
            const payload = {
              title: notificationTitle,
              message: notificationMessage,
              type: 'added',
              related_doc_id: newId,
              created_at: new Date().toISOString()
            };
            
            // Emit to the creator's user room
            if (req?.currentUser?.id) {
              req?.io?.to(`user:${req.currentUser.id}`).emit('notification:new', payload);
            }
            
            // Broadcast based on visibility settings
            if (visibleToAll === 1) {
              req?.io?.emit('notification:new', payload);
            } else {
              // Targeted emits for regular documents
              if (Array.isArray(departmentIds)) {
                for (const deptId of departmentIds) {
                  if (deptId) req?.io?.to(`dept:${deptId}`).emit('notification:new', payload);
                }
              }
              if (allowedUserIdsCsv) {
                const ids = String(allowedUserIdsCsv).split(',').map(s => s.trim()).filter(Boolean);
                for (const uid of ids) {
                  req?.io?.to(`user:${uid}`).emit('notification:new', payload);
                }
              }
              if (allowedRolesCsv) {
                const roles = String(allowedRolesCsv).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                for (const r of roles) {
                  req?.io?.to(`role:${r}`).emit('notification:new', payload);
                }
              }
            }
          } catch (e) {
            console.warn('Socket emit failed (notification:new):', e?.message || e);
          }
        }

        // Fetch the created document summary
        const [rows] = await db.promise().query(
          `SELECT d.doc_id AS id, dt.name AS doc_type, d.reference, d.title, d.revision, d.rev_date, d.from_field, d.to_field, d.date_received, d.google_drive_link, d.description, d.visible_to_all, d.created_at, d.updated_at,
           GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
           GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids,
           GROUP_CONCAT(DISTINCT ar.action_name ORDER BY ar.action_name SEPARATOR ', ') AS action_required_names
           FROM dms_documents d 
           LEFT JOIN document_types dt ON d.doc_type = dt.type_id 
           LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
           LEFT JOIN departments dept ON dd.department_id = dept.department_id
           LEFT JOIN document_actions da ON d.doc_id = da.doc_id
           LEFT JOIN action_required ar ON da.action_id = ar.action_id
           WHERE d.doc_id = ?
           GROUP BY d.doc_id`,
          [newId]
        );

        if (rows.length === 0) {
          return res.json({ success: true, message: 'Document added.' });
        }

        const r = rows[0];
        const document = {
          id: r.id,
          doc_type: r.doc_type || '',
          reference: r.reference || '',
          title: r.title || '',
          revision: r.revision || '',
          rev_date: r.rev_date || null,
          from_field: r.from_field || '',
          to_field: r.to_field || '',
          date_received: r.date_received || null,
          google_drive_link: r.google_drive_link || '',
          description: r.description || '',
          visible_to_all: r.visible_to_all,
          created_at: r.created_at,
          updated_at: r.updated_at,
          department_names: r.department_names || '',
          department_ids: r.department_ids || '',
          action_required: r.action_required_names ? r.action_required_names.split(', ').filter(Boolean) : []
        };

        return res.json({ success: true, message: 'Document added.', document });
      } catch (error) {
        console.error('Error inserting document:', error);
        return res.status(500).json({ success: false, message: 'Database error.' });
      }
    };

    // Resolve folder ID (case-insensitive)
    let folderId = null;
    if (resolvedFolder) {
      try {
        const [folderRows] = await db.promise().query('SELECT folder_id FROM folders WHERE LOWER(name) = LOWER(?)', [resolvedFolder]);
        if (folderRows.length > 0) folderId = folderRows[0].folder_id;
      } catch (e) {
        console.error('Error resolving folder:', e);
      }
    }

    if (!resolvedCategory) {
      return await insertDoc(null, folderId);
    }

    // Ensure document type exists (create if missing) - case-insensitive match, insert normalized name
    try {
      const [rows] = await db.promise().query('SELECT type_id FROM document_types WHERE LOWER(name) = LOWER(?)', [resolvedCategory]);
      if (rows.length > 0) {
        return await insertDoc(rows[0].type_id, folderId);
      }
      const [result] = await db.promise().query('INSERT INTO document_types (name) VALUES (?)', [resolvedCategory]);
      return await insertDoc(result.insertId, folderId);
    } catch (error) {
      console.error('Error handling document type:', error);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Update document
router.put('/documents/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  // Validate document exists first
  db.query('SELECT * FROM dms_documents WHERE doc_id = ?', [id], (err, rows) => {
    if (err) {
      console.error('Database error checking document:', err);
      return res.status(500).json({ success: false, message: 'Database error while checking document.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Only allow specific fields to be updated
    const allowedFields = {
      title: 'title',
      reference: 'reference',
      from_field: 'from_field',
      to_field: 'to_field',
      date_received: 'date_received',
      description: 'description',
      google_drive_link: 'google_drive_link',
      available_copy: 'available_copy',
      revision: 'revision',
      rev_date: 'rev_date',
      visible_to_all: 'visible_to_all',
      allowed_user_ids: 'allowed_user_ids',
      allowed_roles: 'allowed_roles'
    };

    const fields = [];
    const values = [];
    // Normalizers
    const toCsv = (v) => {
      if (v === null || v === undefined) return null;
      if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean).join(',');
      return String(v).split(',').map(s => s.trim()).filter(Boolean).join(',');
    };

    // Apply standard fields
    Object.entries(updates).forEach(([k, v]) => {
      if (!allowedFields[k] || v === undefined || v === null) return;
      // Normalize special fields
      if (k === 'visible_to_all') {
        const normalized = v ? 1 : 0;
        fields.push(`${allowedFields[k]} = ?`);
        values.push(normalized);
        return;
      }
      if (k === 'allowed_user_ids') {
        const csv = toCsv(v);
        fields.push(`${allowedFields[k]} = ?`);
        values.push(csv || null);
        return;
      }
      if (k === 'allowed_roles') {
        const csv = (toCsv(v) || '').toLowerCase().replace(/\s+/g, '');
        fields.push(`${allowedFields[k]} = ?`);
        values.push(csv || null);
        return;
      }
      fields.push(`${allowedFields[k]} = ?`);
      values.push(v);
    });

    // Handle folder_ids (multi-folder) update separately
    const folderIdsUpdate = Array.isArray(updates.folder_ids)
      ? updates.folder_ids.map(Number).filter(Boolean)
      : null;

    // Handle category update if provided
    const performUpdate = (typeId) => {
      if (typeId) {
        fields.push('doc_type = ?');
        values.push(typeId);
      }
      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
      }
      fields.push('updated_at = NOW()');
      db.query(`UPDATE dms_documents SET ${fields.join(', ')}, updated_at = NOW() WHERE doc_id = ?`, [...values, id], async (updateErr) => {
        if (updateErr) {
          console.error('Database error updating document:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error while updating document.' });
        }
        // Apply multi-folder changes if provided
        if (folderIdsUpdate) {
          try {
            await db.promise().query('DELETE FROM document_folders WHERE doc_id = ?', [id]);
            if (folderIdsUpdate.length > 0) {
              for (const fid of folderIdsUpdate) {
                await db.promise().query('INSERT INTO document_folders (doc_id, folder_id) VALUES (?, ?)', [id, fid]);
              }
            }
          } catch (e) {
            console.warn('Failed updating document_folders:', e?.message || e);
          }
        }
        return res.json({ success: true, message: 'Document updated successfully.' });
      });
    };

    if (updates.category) {
      db.query('SELECT type_id FROM document_types WHERE name = ?', [updates.category], (err4, typeRows) => {
        if (err4) {
          console.error('Database error checking document type:', err4);
          return res.status(500).json({ success: false, message: 'Database error while checking document type.' });
        }
        if (typeRows.length > 0) {
          performUpdate(typeRows[0].type_id);
        } else {
          db.query('INSERT INTO document_types (name) VALUES (?)', [updates.category], (err5, result) => {
            if (err5) {
              console.error('Database error creating document type:', err5);
              return res.status(500).json({ success: false, message: 'Database error while creating document type.' });
            }
            performUpdate(result.insertId);
          });
        }
      });
    } else {
      performUpdate(null);
    }
  });
});

// Delete document
router.delete('/documents/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM dms_documents WHERE doc_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    return res.json({ success: true, message: 'Document deleted.' });
  });
});
