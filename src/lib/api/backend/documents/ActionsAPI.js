import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get action required options from database
router.get('/action-required', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT action_id, action_name, action_category, is_active
       FROM action_required
       WHERE is_active = 1
       ORDER BY action_name ASC`
    );
    const actions = rows.map(r => ({
      id: r.action_id,
      name: r.action_name,
      category: r.action_category,
      is_active: r.is_active === 1 || r.is_active === true
    }));
    res.json({ success: true, actions });
  } catch (error) {
    console.error('Error fetching action required:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

export default router;
