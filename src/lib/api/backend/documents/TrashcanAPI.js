import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
  // Prefer passport session user if present, else fallback to our own session user
  const passportUser = req.user;
  const sessionUser = req.session && req.session.user;
  const user = passportUser || sessionUser;
  
  console.log('Auth middleware - User object:', user);
  console.log('Auth middleware - Session:', req.session);
  
  if (!user) {
    console.log('Auth middleware - No user found');
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  
  // Normalize minimal shape for downstream use
  req.currentUser = {
    id: user.user_id || user.id,
    email: user.user_email || user.email,
    username: user.Username || user.username,
    role: user.role,
    department: user.department,
    department_id: user.department_id || user.dept_id || user.departmentId || null,
  };
  
  console.log('Auth middleware - Normalized user:', req.currentUser);
  next();
};

// Role-based authorization middleware for admin/dean only
const requireAdminOrDean = (req, res, next) => {
  const user = req.currentUser;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  
  // Case-insensitive role checking
  const role = (user.role || '').toString().toLowerCase();
  const validRoles = ['admin', 'administrator', 'dean'];
  
  if (!validRoles.includes(role)) {
    console.log('Access denied for role:', user.role, 'User:', user.username);
    return res.status(403).json({ 
      success: false, 
              message: `Access denied. Role '${user.role}' does not have sufficient privileges. Admin or dean required.` 
    });
  }
  
  console.log('Access granted for role:', user.role, 'User:', user.username);
  next();
};

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ispsc_tagudin_dms_2'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Move document to trashcan (soft delete) or restore (soft undelete)
router.post('/documents/trashcan', requireAuth, requireAdminOrDean, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { documentId, action, deletedAt } = req.body || {};
    const currentUser = req.currentUser;
    const toNull = (v) => (v === undefined ? null : v);
    const docId = Number(documentId);
    if (!docId || Number.isNaN(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing documentId' });
    }
    if (!action || (action !== 'move_to_trashcan' && action !== 'restore_from_trashcan')) {
      return res.status(400).json({ success: false, message: 'Invalid action specified' });
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    if (action === 'move_to_trashcan') {
      // Read original doc for notification context
      const [docRows] = await connection.execute('SELECT title FROM dms_documents WHERE doc_id = ?', [docId]);
      if (docRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      const document = docRows[0];

      // If dean, ensure document belongs to dean's department before moving to trash
      const isDean = (currentUser?.role || '').toString().toLowerCase() === 'dean';
      if (isDean && currentUser?.department_id) {
        const [deptRows] = await connection.execute(
          'SELECT department_id FROM document_departments WHERE doc_id = ?',
          [docId]
        );
        const depts = Array.isArray(deptRows) ? deptRows.map(r => Number(r.department_id)) : [];
        if (!depts.includes(Number(currentUser.department_id))) {
          await connection.rollback();
          return res.status(403).json({ success: false, message: 'Access denied for this document department.' });
        }
      }

      // Soft delete in main table with audit fields supported by schema
      await connection.execute(
        'UPDATE dms_documents SET deleted = 1, deleted_at = ?, deleted_by_name = ? WHERE doc_id = ?',
        [deletedAt || new Date().toISOString(), (currentUser.username || currentUser.email || 'Unknown User'), docId]
      );

      // Notification (DB)
      await connection.execute(
        `INSERT INTO notifications (title, message, type, related_doc_id) VALUES (?, ?, ?, ?)`,
        [
          'Document Moved to Trashcan',
          `Document "${document.title}" has been moved to trashcan by ${currentUser.username || currentUser.email}`,
          'deleted',
          docId
        ]
      );

      // Realtime notification (Socket.IO)
      try {
        const payload = {
          title: 'Document Moved to Trashcan',
          message: `Document "${document.title}" has been moved to trashcan by ${currentUser.username || currentUser.email}`,
          type: 'deleted',
          related_doc_id: docId,
          created_at: new Date().toISOString()
        };
        // Emit to admins room
        req?.io?.to('role:ADMIN').emit('notification:new', payload);
        // Emit to creator if we can resolve user id by name (best effort is skipped here to avoid heavy lookup)
        // Clients already subscribed to role/admin will receive it.
      } catch (e) {
        console.warn('Socket emit (delete) failed:', e?.message || e);
      }

      await connection.commit();
      return res.json({ success: true, message: 'Document moved to trashcan successfully', documentId: docId });
    } else if (action === 'restore_from_trashcan') {
      // Read doc for notification
      const [docRows] = await connection.execute('SELECT title FROM dms_documents WHERE doc_id = ?', [docId]);
      if (docRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      const document = docRows[0];

      // If dean, ensure document belongs to dean's department before restore
      const isDean = (currentUser?.role || '').toString().toLowerCase() === 'dean';
      if (isDean && currentUser?.department_id) {
        const [deptRows] = await connection.execute(
          'SELECT department_id FROM document_departments WHERE doc_id = ?',
          [docId]
        );
        const depts = Array.isArray(deptRows) ? deptRows.map(r => Number(r.department_id)) : [];
        if (!depts.includes(Number(currentUser.department_id))) {
          await connection.rollback();
          return res.status(403).json({ success: false, message: 'Access denied for this document department.' });
        }
      }

      // Restore flags
      // Restore with audit fields supported by schema
      await connection.execute(
        `UPDATE dms_documents 
           SET deleted = 0, 
               deleted_at = NULL, 
               deleted_by_name = NULL, 
               restored_at = ?, 
               restored_by_name = ?
         WHERE doc_id = ?`,
        [new Date().toISOString(), (currentUser.username || currentUser.email || 'Unknown User'), docId]
      );

      await connection.execute(
        `INSERT INTO notifications (title, message, type, related_doc_id) VALUES (?, ?, ?, ?)`,
        [
          'Document Restored',
          `Document "${document.title}" has been restored by ${currentUser.username || currentUser.email}`,
          'updated',
          docId
        ]
      );

      // Realtime notification (Socket.IO)
      try {
        const payload = {
          title: 'Document Restored',
          message: `Document "${document.title}" has been restored by ${currentUser.username || currentUser.email}`,
          type: 'updated',
          related_doc_id: docId,
          created_at: new Date().toISOString()
        };
        req?.io?.to('role:ADMIN').emit('notification:new', payload);
      } catch (e) {
        console.warn('Socket emit (restore) failed:', e?.message || e);
      }

      await connection.commit();
      return res.json({ success: true, message: 'Document restored successfully', documentId: docId });
    } else {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: 'Invalid action specified'
      });
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('Error in trashcan operation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// List soft-deleted documents (trash view)
router.get('/documents/trashcan', requireAuth, requireAdminOrDean, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Disable caching so updated fields (e.g., profile pics) are not served stale
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const isDean = (req.currentUser?.role || '').toString().toLowerCase() === 'dean';
    const deanDeptId = req.currentUser?.department_id ? Number(req.currentUser.department_id) : null;

    // Base SQL
    let sql = `SELECT 
          d.doc_id,
          d.title,
          d.reference,
          d.from_field,
          d.to_field,
          d.doc_type,
          d.description,
          d.created_at,
          d.updated_at,
          d.deleted,
          d.deleted_at,
          d.deleted_by_name,
          d.created_by_name,
          u_created.profile_pic AS created_by_profile_pic,
          u_deleted.profile_pic AS deleted_by_profile_pic,
          GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
          GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids
       FROM dms_documents d
       LEFT JOIN dms_user u_created 
         ON u_created.user_id = d.created_by_user_id
         OR u_created.Username = d.created_by_name 
         OR CONCAT(u_created.firstname, ' ', u_created.lastname) = d.created_by_name
         OR u_created.user_email = d.created_by_name
       LEFT JOIN dms_user u_deleted 
         ON u_deleted.Username = d.deleted_by_name 
         OR CONCAT(u_deleted.firstname, ' ', u_deleted.lastname) = d.deleted_by_name
         OR u_deleted.user_email = d.deleted_by_name
       LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
       LEFT JOIN departments dept ON dd.department_id = dept.department_id
       WHERE COALESCE(d.deleted, 0) = 1`;

    const params = [];
    if (isDean && deanDeptId) {
      sql += ' AND dd.department_id = ?';
      params.push(deanDeptId);
    }

    sql += `
       GROUP BY d.doc_id
       ORDER BY d.deleted_at DESC`;

    const [rows] = await connection.execute(sql, params);
    res.json({ success: true, deletedDocuments: rows });
  } catch (error) {
    console.error('Error fetching deleted documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Permanently delete a soft-deleted document
router.delete('/documents/trashcan/:documentId', requireAuth, requireAdminOrDean, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { documentId } = req.params;
    
    // Start transaction
    await connection.beginTransaction();
    
    // Get document info before permanent deletion
    const [docRows] = await connection.execute('SELECT title, deleted FROM dms_documents WHERE doc_id = ?', [documentId]);
    if (docRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    const { title, deleted } = docRows[0];
    if (!deleted) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Document is not in trash' });
    }

    // If dean, ensure document belongs to dean's department before permanent delete
    const isDean = (req.currentUser?.role || '').toString().toLowerCase() === 'dean';
    if (isDean && req.currentUser?.department_id) {
      const [deptRows] = await connection.execute(
        'SELECT department_id FROM document_departments WHERE doc_id = ?',
        [documentId]
      );
      const depts = Array.isArray(deptRows) ? deptRows.map(r => Number(r.department_id)) : [];
      if (!depts.includes(Number(req.currentUser.department_id))) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied for this document department.' });
      }
    }

    // Permanently delete from documents table
    await connection.execute('DELETE FROM dms_documents WHERE doc_id = ?', [documentId]);

    // Create notification about permanent deletion (no related_doc_id since document is deleted)
    await connection.execute(
      `INSERT INTO notifications (title, message, type, related_doc_id) VALUES (?, ?, ?, ?)`,
      [
        'Document Permanently Deleted',
        `Document "${title}" has been permanently deleted from trashcan`,
        'deleted',
        null
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Document permanently deleted',
      documentId: documentId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error permanently deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Health check endpoint (no auth required)
router.get('/trashcan/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Trashcan API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
