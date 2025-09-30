import express from 'express';
import db from '../connections/connection.js';

const router = express.Router();

// Helpers
const deriveUserName = (u) => (
  u?.Username ||
  u?.username ||
  (u?.firstname && u?.lastname ? `${u.firstname} ${u.lastname}` : null) ||
  u?.name ||
  null
);
const deriveUserRole = (u) => (u?.role ? String(u.role).toUpperCase() : '');
const deriveUserDept = (u) => (u?.department_id ?? u?.department ?? null);

// GET /api/announcements → list newest first, include targets
router.get('/announcements', (req, res) => {
  try {
    const sql = `SELECT 
      a.announcement_id AS id,
      a.title,
      a.body AS message,
      a.visible_to_all,
      a.created_at,
      a.created_by_name AS created_by,
      u.profile_pic AS created_by_profile_pic,
      a.status,
      a.publish_at,
      a.expire_at
    FROM announcements a
    LEFT JOIN dms_user u 
      ON u.Username = a.created_by_name 
      OR CONCAT(u.firstname, ' ', u.lastname) = a.created_by_name
    ORDER BY COALESCE(a.publish_at, a.created_at) DESC`;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      const announcements = rows || [];
      if (announcements.length === 0) return res.json({ success: true, announcements });

      const ids = announcements.map(r => r.id);
      const qDept = 'SELECT announcement_id, department_id FROM announcement_departments WHERE announcement_id IN (?)';
      const qRole = 'SELECT announcement_id, role FROM announcement_roles WHERE announcement_id IN (?)';
      const qUser = 'SELECT announcement_id, user_id FROM announcement_users WHERE announcement_id IN (?)';

      db.query(qDept, [ids], (e1, depts) => {
        if (e1) return res.status(500).json({ success: false, message: 'DB error' });
        db.query(qRole, [ids], (e2, roles) => {
          if (e2) return res.status(500).json({ success: false, message: 'DB error' });
          db.query(qUser, [ids], (e3, users) => {
            if (e3) return res.status(500).json({ success: false, message: 'DB error' });

            const byAnn = Object.fromEntries(ids.map(id => [id, { departments: [], roles: [], users: [] }]));
            (depts || []).forEach(d => byAnn[d.announcement_id]?.departments.push(d.department_id));
            (roles || []).forEach(r => byAnn[r.announcement_id]?.roles.push(r.role));
            (users || []).forEach(u => byAnn[u.announcement_id]?.users.push(u.user_id));

            const enriched = announcements.map(a => ({
              ...a,
              target_departments: byAnn[a.id]?.departments || [],
              target_roles: byAnn[a.id]?.roles || [],
              target_users: byAnn[a.id]?.users || [],
            }));

            res.json({ success: true, announcements: enriched });
          });
        });
      });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load announcements' });
  }
});

export default router;
// POST /api/announcements → create (supports visibility targets)
router.post('/announcements', (req, res) => {
  try {
    const { title, message, visible_to_all, target_departments, target_roles, target_users, publish_at, expire_at } = req.body || {};
    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    const role = deriveUserRole(req.user);
    if (role === 'FACULTY') return res.status(403).json({ success: false, message: 'Not allowed' });
    const createdBy = deriveUserName(req.user) || 'System';
    const isPublic = visible_to_all === true || visible_to_all === 1 || String(visible_to_all).toLowerCase() === 'true';

    // DEAN scope: cannot post public and can only target their department
    const userDept = deriveUserDept(req.user);
    let scopedIsPublic = isPublic;
    let scopedTargetDepts = Array.isArray(target_departments) ? target_departments : [];
    if (role === 'DEAN') {
      scopedIsPublic = false;
      scopedTargetDepts = userDept != null ? [userDept] : [];
    }
    const sql = `INSERT INTO announcements (title, body, visible_to_all, status, publish_at, expire_at, created_by_name, created_at)
                 VALUES (?, ?, ?, 'published', COALESCE(?, NOW()), ?, ?, NOW())`;
    const params = [String(title).trim(), String(message).trim(), scopedIsPublic ? 1 : 0, publish_at || null, expire_at || null, createdBy];
    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB insert error' });
      const id = result.insertId;

      // Insert targets if not public
      const tDepts = scopedTargetDepts;
      const tRoles = Array.isArray(target_roles) ? target_roles : [];
      const tUsers = Array.isArray(target_users) ? target_users : [];

      const tasks = [];
      if (!scopedIsPublic && tDepts.length > 0) {
        const values = tDepts.map(d => [id, d]);
        tasks.push(new Promise((resolve, reject) => {
          db.query('INSERT INTO announcement_departments (announcement_id, department_id) VALUES ?', [values], (e) => e ? reject(e) : resolve());
        }));
      }
      if (!scopedIsPublic && tRoles.length > 0) {
        const values = tRoles.map(r => [id, r]);
        tasks.push(new Promise((resolve, reject) => {
          db.query('INSERT INTO announcement_roles (announcement_id, role) VALUES ?', [values], (e) => e ? reject(e) : resolve());
        }));
      }
      if (!scopedIsPublic && tUsers.length > 0) {
        const values = tUsers.map(u => [id, u]);
        tasks.push(new Promise((resolve, reject) => {
          db.query('INSERT INTO announcement_users (announcement_id, user_id) VALUES ?', [values], (e) => e ? reject(e) : resolve());
        }));
      }

      Promise.all(tasks).then(() => {
        // Create a notification entry for this announcement
        const notifTitle = `New Announcement: ${params[0]}`;
        const notifMessage = params[1];
        const notifSql = `INSERT INTO notifications (title, message, type, visible_to_all, created_at, related_doc_id)
                          VALUES (?, ?, 'announcement', ?, NOW(), ?)`;
        db.query(notifSql, [notifTitle, notifMessage, scopedIsPublic ? 1 : 0, id], (nErr, nRes) => {
          if (nErr) {
            // Do not fail the main request if notification creation fails
            console.error('Failed to create announcement notification:', nErr);
          } else {
            const notificationId = nRes?.insertId;
            const nTasks = [];
            if (!scopedIsPublic && notificationId) {
              if (tDepts.length) {
                const v = tDepts.map(d => [notificationId, d]);
                nTasks.push(new Promise((resolve, reject) => {
                  db.query('INSERT INTO notification_departments (notification_id, department_id) VALUES ?', [v], (e) => e ? reject(e) : resolve());
                }));
              }
              if (tRoles.length) {
                const v = tRoles.map(r => [notificationId, r]);
                nTasks.push(new Promise((resolve, reject) => {
                  db.query('INSERT INTO notification_roles (notification_id, role) VALUES ?', [v], (e) => e ? reject(e) : resolve());
                }));
              }
              if (tUsers.length) {
                const v = tUsers.map(u => [notificationId, u]);
                nTasks.push(new Promise((resolve, reject) => {
                  db.query('INSERT INTO notification_users (notification_id, user_id) VALUES ?', [v], (e) => e ? reject(e) : resolve());
                }));
              }
            }
            Promise.all(nTasks).then(() => {
              try {
                req.io?.emit?.('notification:new', {
                  id: notificationId,
                  title: notifTitle,
                  message: notifMessage,
                  type: 'announcement',
                  visible_to_all: scopedIsPublic ? 1 : 0,
                  created_at: new Date().toISOString(),
                  related_doc_id: id,
                });
              } catch (_) {}
            }).catch((e) => console.error('Failed to save notification targets:', e));
          }
        });

        const item = {
          id,
          title: params[0],
          message: params[1],
          visible_to_all: scopedIsPublic ? 1 : 0,
          status: 'published',
          publish_at: publish_at || new Date().toISOString(),
          expire_at: expire_at || null,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          target_departments: tDepts,
          target_roles: tRoles,
          target_users: tUsers,
          created_by_profile_pic: req.user?.profile_pic || null,
        };
        try { req.io?.emit?.('announcement:new', item); } catch (_) {}
        return res.status(201).json({ success: true, announcement: item });
      }).catch(() => {
        res.status(500).json({ success: false, message: 'Failed to save targets' });
      });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }

});

// PUT /api/announcements/:id → update (creator only; dean scoping)
router.put('/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, visible_to_all, target_departments, target_roles, target_users } = req.body || {};
    const role = deriveUserRole(req.user);
    if (role === 'FACULTY') return res.status(403).json({ success: false, message: 'Not allowed' });
    const currentUserName = deriveUserName(req.user) || 'System';

    // Check ownership
    const ownerSql = 'SELECT created_by_name FROM announcements WHERE announcement_id = ?';
    db.query(ownerSql, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      const creator = rows?.[0]?.created_by_name;
      if (creator !== currentUserName && role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Not allowed' });

      // Scope for DEAN: cannot be public and must target own department
      const isPublicReq = visible_to_all === true || visible_to_all === 1 || String(visible_to_all).toLowerCase() === 'true';
      const userDept = deriveUserDept(req.user);
      const scopedIsPublic = role === 'DEAN' ? false : isPublicReq;
      const tDepts = role === 'DEAN' ? (userDept != null ? [userDept] : []) : (Array.isArray(target_departments) ? target_departments : []);
      const tRoles = Array.isArray(target_roles) ? target_roles : [];
      const tUsers = Array.isArray(target_users) ? target_users : [];

      const updSql = 'UPDATE announcements SET title = ?, body = ?, visible_to_all = ? WHERE announcement_id = ?';
      db.query(updSql, [String(title || '').trim(), String(message || '').trim(), scopedIsPublic ? 1 : 0, id], (e1) => {
        if (e1) return res.status(500).json({ success: false, message: 'DB update error' });

        // refresh targets
        const clearTargets = [
          new Promise((resolve, reject) => db.query('DELETE FROM announcement_departments WHERE announcement_id = ?', [id], (e)=> e?reject(e):resolve())),
          new Promise((resolve, reject) => db.query('DELETE FROM announcement_roles WHERE announcement_id = ?', [id], (e)=> e?reject(e):resolve())),
          new Promise((resolve, reject) => db.query('DELETE FROM announcement_users WHERE announcement_id = ?', [id], (e)=> e?reject(e):resolve())),
        ];
        Promise.all(clearTargets).then(() => {
          const insertTasks = [];
          if (!scopedIsPublic && tDepts.length) {
            insertTasks.push(new Promise((resolve, reject) => {
              const values = tDepts.map(d => [id, d]);
              db.query('INSERT INTO announcement_departments (announcement_id, department_id) VALUES ?', [values], (e)=> e?reject(e):resolve());
            }));
          }
          if (!scopedIsPublic && tRoles.length) {
            insertTasks.push(new Promise((resolve, reject) => {
              const values = tRoles.map(r => [id, r]);
              db.query('INSERT INTO announcement_roles (announcement_id, role) VALUES ?', [values], (e)=> e?reject(e):resolve());
            }));
          }
          if (!scopedIsPublic && tUsers.length) {
            insertTasks.push(new Promise((resolve, reject) => {
              const values = tUsers.map(u => [id, u]);
              db.query('INSERT INTO announcement_users (announcement_id, user_id) VALUES ?', [values], (e)=> e?reject(e):resolve());
            }));
          }
          Promise.all(insertTasks).then(() => {
            const item = {
              id: Number(id),
              title: String(title || ''),
              message: String(message || ''),
              visible_to_all: scopedIsPublic ? 1 : 0,
              created_by: creator,
              target_departments: tDepts,
              target_roles: tRoles,
              target_users: tUsers,
              created_by_profile_pic: req.user?.profile_pic || null,
            };
            try { req.io?.emit?.('announcement:updated', item); } catch (_) {}
            return res.json({ success: true, announcement: item });
          }).catch(() => res.status(500).json({ success: false, message: 'Failed to save targets' }));
        }).catch(() => res.status(500).json({ success: false, message: 'Failed to clear targets' }));
      });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update announcement' });
  }
});

// DELETE /api/announcements/:id → delete
router.delete('/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const role = deriveUserRole(req.user);
    if (role === 'FACULTY') return res.status(403).json({ success: false, message: 'Not allowed' });
    const createdBy = deriveUserName(req.user) || 'System';

    const sql = `SELECT created_by_name FROM announcements WHERE announcement_id = ?`;
    db.query(sql, [id], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      const creator = rows?.[0]?.created_by_name;
      if (creator !== createdBy && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Not allowed' });
      }

      const deleteSql = `DELETE FROM announcements WHERE announcement_id = ?`;
      db.query(deleteSql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'DB delete error' });
        try { req.io?.emit?.('announcement:deleted', id); } catch (_) {}
        return res.status(200).json({ success: true });
      });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
});
