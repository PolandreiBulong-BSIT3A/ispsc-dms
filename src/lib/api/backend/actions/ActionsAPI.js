import express from 'express';
import db from '../connections/connection.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all actions
router.get('/actions', requireAuth, async (req, res) => {
  try {
    const [actions] = await db.promise().execute(
      `SELECT 
        action_id, 
        action_name, 
        action_description, 
        action_category, 
        is_active, 
        created_at, 
        updated_at
      FROM action_required 
      ORDER BY action_name ASC`
    );
    
    res.json({ success: true, actions });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch actions' });
  }
});

// Get specific action by ID
router.get('/actions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [actions] = await db.promise().execute(
      'SELECT * FROM action_required WHERE action_id = ?',
      [id]
    );

    if (actions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
    }

    res.json({
      success: true,
      action: actions[0]
    });
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch action' });
  }
});

// Create new action
router.post('/actions', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { action_name, action_description, action_category, is_active = 1 } = req.body;
    
    if (!action_name) {
      return res.status(400).json({ success: false, message: 'Action name is required' });
    }

    // Check if action name already exists
    const [existing] = await db.promise().execute(
      'SELECT action_id FROM action_required WHERE action_name = ?',
      [action_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Action name already exists' });
    }

    const [result] = await db.promise().execute(
      'INSERT INTO action_required (action_name, action_description, action_category, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
      [action_name, action_description, action_category, is_active, req.user.user_id || req.user.id]
    );

    const [newAction] = await db.promise().execute(
      'SELECT * FROM action_required WHERE action_id = ?',
      [result.insertId]
    );

    res.json({ 
      success: true, 
      message: 'Action created successfully',
      action: newAction[0]
    });
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ success: false, message: 'Failed to create action' });
  }
});

// Update action
router.put('/actions/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { action_name, action_description, action_category, is_active } = req.body;
    
    if (!action_name) {
      return res.status(400).json({ success: false, message: 'Action name is required' });
    }

    // Check if action exists
    const [existing] = await db.promise().execute(
      'SELECT action_id FROM action_required WHERE action_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }

    // Check if name is taken by another action
    const [nameCheck] = await db.promise().execute(
      'SELECT action_id FROM action_required WHERE action_name = ? AND action_id != ?',
      [action_name, id]
    );

    if (nameCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Action name already exists' });
    }

    await db.promise().execute(
      'UPDATE action_required SET action_name = ?, action_description = ?, action_category = ?, is_active = ?, updated_at = NOW() WHERE action_id = ?',
      [action_name, action_description, action_category, is_active, id]
    );

    const [updatedAction] = await db.promise().execute(
      'SELECT * FROM action_required WHERE action_id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Action updated successfully',
      action: updatedAction[0]
    });
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({ success: false, message: 'Failed to update action' });
  }
});

// Delete action
router.delete('/actions/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if action exists
    const [existing] = await db.promise().execute(
      'SELECT action_id FROM action_required WHERE action_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }

    await db.promise().execute(
      'DELETE FROM action_required WHERE action_id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Action deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({ success: false, message: 'Failed to delete action' });
  }
});

export default router;
