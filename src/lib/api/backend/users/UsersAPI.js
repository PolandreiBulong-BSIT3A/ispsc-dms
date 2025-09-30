import express from 'express';
import db from '../connections/connection.js';
import { requireAuth, requireDean, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users - list users with optional filters
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { department, role, status } = req.query;
    const current = req.currentUser || {};
    const isDean = (current.role || '').toString().toLowerCase() === 'dean';

    const filters = [];
    const values = [];

    // Dean restriction: only own department
    if (isDean && current.department_id) {
      filters.push('u.department_id = ?');
      values.push(current.department_id);
    } else if (department) {
      if (isNaN(department)) {
        filters.push('(d.name = ? OR d.code = ?)');
        values.push(department, department);
      } else {
        filters.push('u.department_id = ?');
        values.push(parseInt(department));
      }
    }

    if (role) {
      filters.push('u.role = ?');
      values.push(role);
    }

    // default to active if not specified
    if (status) {
      filters.push('u.status = ?');
      values.push(status);
    } else {
      filters.push('u.status = ?');
      values.push('active');
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `
      SELECT 
        u.user_id AS id,
        u.user_email AS email,
        u.Username AS username,
        u.firstname,
        u.lastname,
        u.Contact_number AS contactNumber,
        u.department_id,
        d.name AS department_name,
        d.code AS department_code,
        u.role,
        u.status,
        u.is_verified AS isVerified,
        u.profile_pic AS profilePic,
        u.created_at,
        u.updated_at
      FROM dms_user u
      LEFT JOIN departments d ON u.department_id = d.department_id
      ${where}
      ORDER BY u.created_at DESC
    `;

    const [rows] = await db.promise().query(sql, values);
    const users = rows.map(r => ({
      ...r,
      name: (r.firstname || r.lastname) ? `${r.firstname || ''} ${r.lastname || ''}`.trim() : r.username
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// GET /api/users/latest
router.get('/users/latest', requireAuth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const sql = `
      SELECT 
        u.user_id AS id,
        u.user_email AS email,
        u.Username AS username,
        u.firstname,
        u.lastname,
        u.role,
        u.status,
        u.profile_pic AS profilePic,
        u.created_at,
        d.name AS department_name
      FROM dms_user u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.status = 'active'
      ORDER BY u.created_at DESC
      LIMIT ?
    `;
    const [rows] = await db.promise().query(sql, [parseInt(limit)]);
    const users = rows.map(r => ({
      ...r,
      name: (r.firstname || r.lastname) ? `${r.firstname || ''} ${r.lastname || ''}`.trim() : r.username
    }));
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching latest users:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// GET /api/users/:id
router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.promise().query(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM dms_user u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.user_id = ?
    `, [id]);

    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const u = results[0];
    res.json({ success: true, user: {
      id: u.user_id,
      email: u.user_email,
      username: u.Username,
      firstname: u.firstname,
      lastname: u.lastname,
      department_id: u.department_id,
      department_name: u.department_name,
      department_code: u.department_code,
      contactNumber: u.Contact_number,
      role: u.role,
      isVerified: u.is_verified,
      profilePic: u.profile_pic,
      status: u.status,
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }});
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// GET /api/users/by-email
router.get('/users/by-email', requireAuth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const [results] = await db.promise().query(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM dms_user u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.user_email = ?
    `, [email]);

    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const u = results[0];
    res.json({ success: true, message: 'User found.', user: {
      id: u.user_id,
      email: u.user_email,
      username: u.Username,
      firstname: u.firstname,
      lastname: u.lastname,
      department_id: u.department_id,
      department_name: u.department_name,
      department_code: u.department_code,
      contactNumber: u.Contact_number,
      role: u.role,
      isVerified: u.is_verified,
      profilePic: u.profile_pic,
      status: u.status,
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }});
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// PUT /api/users/update-profile
router.put('/users/update-profile', requireAuth, async (req, res) => {
  try {
    const { email, username, firstname, lastname, department, contactNumber } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const fields = [];
    const values = [];

    if (username !== undefined) { fields.push('Username = ?'); values.push(username); }
    if (firstname !== undefined) { fields.push('firstname = ?'); values.push(firstname); }
    if (lastname !== undefined) { fields.push('lastname = ?'); values.push(lastname); }
    if (contactNumber !== undefined) { fields.push('Contact_number = ?'); values.push(contactNumber); }

    if (department !== undefined) {
      if (isNaN(department)) {
        const [deptResults] = await db.promise().query(
          'SELECT department_id FROM departments WHERE code = ? OR name = ?',
          [department, department]
        );
        if (deptResults.length > 0) {
          fields.push('department_id = ?');
          values.push(deptResults[0].department_id);
        }
      } else {
        fields.push('department_id = ?');
        values.push(parseInt(department));
      }
    }

    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No updatable fields provided.' });

    const sql = `UPDATE dms_user SET ${fields.join(', ')} WHERE user_email = ?`;
    values.push(email);
    await db.promise().query(sql, values);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// PUT /api/users/:id
router.put('/users/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let { department_id, role } = req.body || {};

    const fields = [];
    const values = [];

    // Validate and normalize department_id
    if (department_id !== undefined) {
      let depIdNum = Number(department_id);
      if (!Number.isFinite(depIdNum)) {
        // Try to resolve by department code or name (e.g., "CAS")
        const depKey = String(department_id).trim();
        const [depLookup] = await db.promise().query(
          'SELECT department_id FROM departments WHERE code = ? OR name = ? LIMIT 1',
          [depKey, depKey]
        );
        if (Array.isArray(depLookup) && depLookup.length > 0) {
          depIdNum = Number(depLookup[0].department_id);
        }
      }
      if (!Number.isFinite(depIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid department_id.' });
      }
      // Verify department exists to avoid FK errors
      const [depExists] = await db.promise().query(
        'SELECT 1 FROM departments WHERE department_id = ? LIMIT 1',
        [depIdNum]
      );
      if (!Array.isArray(depExists) || depExists.length === 0) {
        return res.status(400).json({ success: false, message: 'Department does not exist.' });
      }
      fields.push('department_id = ?');
      values.push(depIdNum);
    }

    // Validate and normalize role
    if (role !== undefined) {
      const normalizedRole = String(role).toUpperCase();
      const allowedRoles = ['ADMIN', 'ADMINISTRATOR', 'DEAN', 'FACULTY'];
      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }
      fields.push('role = ?');
      values.push(normalizedRole);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
    }

    const sql = `UPDATE dms_user SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`;
    values.push(id);

    const [result] = await db.promise().query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    // Handle foreign key constraint errors clearly for clients
    if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452)) {
      return res.status(400).json({ success: false, message: 'Invalid department_id (foreign key).' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// POST /api/users/trash - soft delete/restore/permanent delete
router.post('/users/trash', requireAuth, requireRole(['admin','administrator','dean']), async (req, res) => {
  try {
    const { userId, userIds, action } = req.body || {};

    if (!action) return res.status(400).json({ success: false, message: 'action is required' });

    if (action === 'move_to_trashcan') {
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
      await db.promise().query(
        `UPDATE dms_user SET status = 'deleted', updated_at = NOW() WHERE user_id = ?`,
        [userId]
      );
      return res.json({ success: true, message: 'User moved to trash' });
    }

    if (action === 'restore_from_trashcan') {
      if (!userId && !Array.isArray(userIds)) return res.status(400).json({ success: false, message: 'userId or userIds is required' });
      if (Array.isArray(userIds) && userIds.length > 0) {
        await db.promise().query(`UPDATE dms_user SET status = 'active', updated_at = NOW() WHERE user_id IN (?)`, [userIds]);
        return res.json({ success: true, message: 'Selected users restored' });
      }
      await db.promise().query(`UPDATE dms_user SET status = 'active', updated_at = NOW() WHERE user_id = ?`, [userId]);
      return res.json({ success: true, message: 'User restored' });
    }

    if (action === 'permanent_delete') {
      if (!userId && !Array.isArray(userIds)) return res.status(400).json({ success: false, message: 'userId or userIds is required' });
      if (Array.isArray(userIds) && userIds.length > 0) {
        await db.promise().query(`DELETE FROM dms_user WHERE user_id IN (?)`, [userIds]);
        return res.json({ success: true, message: 'Selected users permanently deleted' });
      }
      await db.promise().query(`DELETE FROM dms_user WHERE user_id = ?`, [userId]);
      return res.json({ success: true, message: 'User permanently deleted' });
    }

    if (action === 'permanent_delete_all') {
      await db.promise().query(`DELETE FROM dms_user WHERE status = 'deleted'`);
      return res.json({ success: true, message: 'All deleted users permanently removed' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('Error in users trash endpoint:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// DELETE /api/users/:id - permanent delete (admin or dean)
router.delete('/users/:id', requireAuth, requireRole(['admin','administrator','dean']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query(`DELETE FROM dms_user WHERE user_id = ?`, [id]);
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// DELETE /api/users/delete-account - self delete
router.delete('/users/delete-account', requireAuth, async (req, res) => {
  try {
    const currentUser = req.currentUser || {};
    if (!currentUser.id) return res.status(400).json({ success: false, message: 'User ID is required.' });

    // Optional: cleanup dependent data here
    await db.promise().query('DELETE FROM dms_user WHERE user_id = ?', [currentUser.id]);
    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (error) {
    console.error('Error deleting own account:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Availability checks
router.get('/users/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  const [rows] = await db.promise().query('SELECT user_id FROM dms_user WHERE user_email = ?', [email]);
  res.json({ success: true, available: rows.length === 0 });
});

router.get('/users/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false, message: 'Username is required.' });
  const [rows] = await db.promise().query('SELECT user_id FROM dms_user WHERE Username = ?', [username]);
  res.json({ success: true, available: rows.length === 0 });
});

export default router;
