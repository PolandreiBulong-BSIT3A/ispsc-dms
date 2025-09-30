import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all departments
router.get('/departments', requireAuth, async (req, res) => {
  try {
    // Get departments with document count and user count
    const [results] = await db.promise().execute(
      `SELECT 
        d.department_id, 
        d.name, 
        d.code, 
        d.is_active,
        COUNT(DISTINCT dd.doc_id) as document_count,
        COUNT(DISTINCT u.user_id) as user_count
      FROM departments d
      LEFT JOIN document_departments dd ON dd.department_id = d.department_id
      LEFT JOIN dms_documents doc ON doc.doc_id = dd.doc_id AND (doc.deleted IS NULL OR doc.deleted = 0)
      LEFT JOIN dms_user u ON u.department_id = d.department_id AND u.status = 'active'
      WHERE d.is_active = 1
      GROUP BY d.department_id, d.name, d.code, d.is_active
      ORDER BY d.name ASC`
    );
    
    res.json({ success: true, departments: results });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// Get specific department by ID
router.get('/departments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [departments] = await db.promise().query(
      'SELECT department_id, name, code, is_active FROM departments WHERE department_id = ? AND is_active = 1',
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department: departments[0]
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/departments', requireAuth, async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' });
    }

    // Check if department code already exists
    const [existing] = await db.promise().execute(
      'SELECT department_id FROM departments WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Department code already exists' });
    }

    const [result] = await db.promise().execute(
      'INSERT INTO departments (name, code, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [name, code]
    );

    const [newDepartment] = await db.promise().execute(
      'SELECT department_id, name, code, created_at, updated_at FROM departments WHERE department_id = ?',
      [result.insertId]
    );

    res.json({ 
      success: true, 
      message: 'Department created successfully',
      department: newDepartment[0]
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
});

// Update department
router.put('/departments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' });
    }

    // Check if trying to edit the protected "Unassigned" department
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit the protected "Unassigned" department' 
      });
    }

    // Check if department exists
    const [existing] = await db.promise().execute(
      'SELECT department_id FROM departments WHERE department_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if code is taken by another department
    const [codeCheck] = await db.promise().execute(
      'SELECT department_id FROM departments WHERE code = ? AND department_id != ?',
      [code, id]
    );

    if (codeCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Department code already exists' });
    }

    await db.promise().execute(
      'UPDATE departments SET name = ?, code = ?, updated_at = NOW() WHERE department_id = ?',
      [name, code, id]
    );

    const [updatedDepartment] = await db.promise().execute(
      'SELECT department_id, name, code, created_at, updated_at FROM departments WHERE department_id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Department updated successfully',
      department: updatedDepartment[0]
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
});

// Delete department
router.delete('/departments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const [existing] = await db.promise().execute(
      'SELECT department_id FROM departments WHERE department_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check if trying to delete the protected "Unassigned" department
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the protected "Unassigned" department' 
      });
    }

    // Get connection for transaction
    const connection = await db.promise().getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Check if department is being used by users
      const [usersCheck] = await connection.execute(
        'SELECT COUNT(*) as count FROM dms_user WHERE department_id = ?',
        [id]
      );

      // Check if department is being used by documents
      const [documentsCheck] = await connection.execute(
        'SELECT COUNT(*) as count FROM document_departments WHERE department_id = ?',
        [id]
      );

      // Only reassign if there are users assigned to this department
      if (usersCheck[0].count > 0) {
        // Reassign all users to protected "Unassigned" department (ID 999)
        await connection.execute(
          'UPDATE dms_user SET department_id = 999 WHERE department_id = ?',
          [id]
        );
      }

      // Only remove document associations if there are any
      if (documentsCheck[0].count > 0) {
        await connection.execute(
          'DELETE FROM document_departments WHERE department_id = ?',
          [id]
        );
      }

      // Now delete the department
      await connection.execute(
        'DELETE FROM departments WHERE department_id = ?',
        [id]
      );

      // Commit the transaction
      await connection.commit();
    } catch (error) {
      // Rollback the transaction if there's an error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }

    res.json({ 
      success: true, 
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

// Get documents by department
router.get('/departments/:id/documents', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    
    const [documents] = await db.promise().execute(
      `SELECT 
        d.doc_id,
        d.title,
        d.reference,
        d.created_at,
        d.from_field,
        d.to_field,
        CONCAT(u.firstname, ' ', u.lastname) as created_by_name
      FROM dms_documents d
      LEFT JOIN dms_user u ON d.created_by_user_id = u.user_id
      LEFT JOIN document_departments dd ON dd.doc_id = d.doc_id
      WHERE dd.department_id = ? AND (d.deleted IS NULL OR d.deleted = 0)
      ORDER BY d.created_at DESC
      LIMIT ?`,
      [id, limit]
    );
    
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents by department:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

// Get users by department
router.get('/departments/:id/users', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    
    const [users] = await db.promise().execute(
      `SELECT 
        u.user_id,
        u.firstname,
        u.lastname,
        u.user_email,
        u.role,
        u.created_at,
        CASE 
          WHEN u.status = 'active' THEN 'Active'
          ELSE 'Inactive'
        END as user_status
      FROM dms_user u
      WHERE u.department_id = ? AND u.status IN ('active', 'inactive')
      ORDER BY u.lastname ASC, u.firstname ASC
      LIMIT ?`,
      [id, limit]
    );
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users by department:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

export default router;
