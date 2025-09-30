import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get notifications (department/role/user scoped)
router.get('/notifications', requireAuth, (req, res) => {
  const currentUser = req.currentUser || {};
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));

  const sql = `
    SELECT 
      n.notification_id AS id,
      n.title,
      n.message,
      n.type,
      n.visible_to_all,
      n.created_at,
      n.related_doc_id,
      EXISTS(
        SELECT 1 FROM notification_reads r
        WHERE r.notification_id = n.notification_id AND r.user_id = ?
      ) AS is_read
    FROM notifications n
    WHERE (
      n.visible_to_all = 1
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_departments nd
            WHERE nd.notification_id = n.notification_id AND nd.department_id = ?
         ))
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_roles nrl
            WHERE nrl.notification_id = n.notification_id AND nrl.role = ?
         ))
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_users nu
            WHERE nu.notification_id = n.notification_id AND nu.user_id = ?
         ))
    )
    ORDER BY is_read ASC, n.created_at DESC
    LIMIT ?
  `;

  const deptParam = currentUser.department_id ?? null;
  const roleParam = (currentUser.role ? String(currentUser.role).toUpperCase() : null);
  const userParam = (currentUser.user_id ?? currentUser.id) ?? null;

  db.query(sql, [userParam, deptParam, deptParam, roleParam, roleParam, userParam, userParam, limit], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    res.json({ success: true, notifications: results });
  });
});

// Get unread notification count
router.get('/notifications/count', requireAuth, (req, res) => {
  const currentUser = req.currentUser || {};

  const sql = `
    SELECT COUNT(*) AS total
    FROM notifications n
    WHERE (
      n.visible_to_all = 1
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_departments nd 
            WHERE nd.notification_id = n.notification_id AND nd.department_id = ?
         ))
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_roles nrl 
            WHERE nrl.notification_id = n.notification_id AND nrl.role = ?
         ))
      OR ( ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM notification_users nu 
            WHERE nu.notification_id = n.notification_id AND nu.user_id = ?
         ))
    )
    AND NOT EXISTS (
      SELECT 1 FROM notification_reads r 
      WHERE r.notification_id = n.notification_id AND r.user_id = ?
    )
  `;

  const deptParam = currentUser.department_id ?? null;
  const roleParam = (currentUser.role ? String(currentUser.role).toUpperCase() : null);
  const userParam = (currentUser.user_id ?? currentUser.id) ?? null;

  db.query(sql, [deptParam, deptParam, roleParam, roleParam, userParam, userParam, userParam], (err, results) => {
    if (err) {
      console.error('Error fetching notification count:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    const total = results[0]?.total || 0;
    res.json({ success: true, count: total });
  });
});

// Mark notification as read
router.post('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.currentUser?.user_id ?? req.currentUser?.id;
    if (!notificationId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing notification ID or user ID' });
    }

    const sql = `
      INSERT INTO notification_reads (notification_id, user_id, read_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE read_at = NOW()
    `;
    db.query(sql, [notificationId, userId], (err) => {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ success: false, message: 'Failed to mark as read' });
      }
      return res.json({ success: true, message: 'Notification marked as read.' });
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', requireAuth, (req, res) => {
  try {
    const currentUser = req.currentUser || {};
    const userId = currentUser.user_id ?? currentUser.id;
    const deptParam = currentUser.department_id ?? null;
    const roleParam = (currentUser.role ? String(currentUser.role).toUpperCase() : null);
    const userParam = userId ?? null;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing user ID' });
    }

    const getNotificationsSql = `
      SELECT DISTINCT n.notification_id
      FROM notifications n
      LEFT JOIN notification_departments nd  ON n.notification_id = nd.notification_id
      LEFT JOIN notification_roles      nrl ON n.notification_id = nrl.notification_id
      LEFT JOIN notification_users      nu  ON n.notification_id = nu.notification_id
      WHERE (
        n.visible_to_all = 1 
        OR ( ? IS NOT NULL AND nd.department_id = ? )
        OR ( ? IS NOT NULL AND nrl.role = ? )
        OR ( ? IS NOT NULL AND nu.user_id = ? )
      )
    `;

    db.query(getNotificationsSql, [deptParam, deptParam, roleParam, roleParam, userParam, userParam], (err, notifications) => {
      if (err) {
        console.error('Error fetching notifications for mark-all:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
      }

      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.json({ success: true, message: 'No notifications to mark as read.', marked_count: 0 });
      }

      const ids = notifications.map(n => n.notification_id);
      const placeholders = ids.map(() => '(?, ?, NOW())').join(', ');
      const values = ids.flatMap(id => [id, userId]);
      const markAllSql = `
        INSERT INTO notification_reads (notification_id, user_id, read_at)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE read_at = NOW()
      `;
      db.query(markAllSql, values, (err2) => {
        if (err2) {
          console.error('Error marking all notifications as read:', err2);
          return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
        }
        return res.json({ success: true, message: `Marked ${ids.length} notifications as read.`, marked_count: ids.length });
      });
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
