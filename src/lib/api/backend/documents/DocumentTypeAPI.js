import express from 'express';
import db from '../connections/connection.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

// Initialize database schema for document_types table
const initializeDocumentTypesSchema = async () => {
  try {
    // Check if description column exists, if not add it
    const [columns] = await db.promise().execute(
      "SHOW COLUMNS FROM document_types LIKE 'description'"
    );
    
    if (columns.length === 0) {
      await db.promise().execute(
        'ALTER TABLE document_types ADD COLUMN description TEXT NULL AFTER name'
      );
      console.log('Added description column to document_types table');
    }

    // Check if created_at column exists, if not add it
    const [createdAtColumns] = await db.promise().execute(
      "SHOW COLUMNS FROM document_types LIKE 'created_at'"
    );
    
    if (createdAtColumns.length === 0) {
      await db.promise().execute(
        'ALTER TABLE document_types ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      );
      console.log('Added created_at column to document_types table');
    }

    // Check if updated_at column exists, if not add it
    const [updatedAtColumns] = await db.promise().execute(
      "SHOW COLUMNS FROM document_types LIKE 'updated_at'"
    );
    
    if (updatedAtColumns.length === 0) {
      await db.promise().execute(
        'ALTER TABLE document_types ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      );
      console.log('Added updated_at column to document_types table');
    }
  } catch (error) {
    console.error('Error initializing document_types schema:', error);
  }
};

// Initialize schema on module load
initializeDocumentTypesSchema();

const router = express.Router();
const toTitleCase = (s) => {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m, p1) => p1.toUpperCase());
};

// Get all document types
router.get('/document-types', requireAuth, async (req, res) => {
  try {
    // First check if description column exists
    let descriptionColumn = '';
    try {
      const [columns] = await db.promise().execute(
        "SHOW COLUMNS FROM document_types LIKE 'description'"
      );
      descriptionColumn = columns.length > 0 ? ', description' : ', NULL as description';
    } catch (e) {
      descriptionColumn = ', NULL as description';
    }

    // Get document types with document count
    const [results] = await db.promise().execute(
      `SELECT 
        dt.type_id, 
        dt.name as type_name${descriptionColumn.replace('description', 'dt.description')},
        dt.created_at,
        dt.updated_at,
        COUNT(d.doc_id) as document_count
      FROM document_types dt
      LEFT JOIN dms_documents d ON d.doc_type = dt.type_id AND (d.deleted IS NULL OR d.deleted = 0)
      GROUP BY dt.type_id, dt.name${descriptionColumn.includes('description') ? ', dt.description' : ''}
      ORDER BY dt.name ASC`
    );
    res.json({ success: true, documentTypes: results });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document types' });
  }
});

// Create new document type
router.post('/document-types', requireAuth, async (req, res) => {
  try {
    const name = toTitleCase((req.body?.type_name || req.body?.name || '').toString().trim());
    const description = (req.body?.description || '').toString().trim();
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Type name is required' });
    }

    // Check if document type already exists
    const [existing] = await db.promise().execute(
      'SELECT type_id FROM document_types WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Document type already exists' });
    }

    // Check if description column exists
    let insertQuery, insertParams, selectQuery;
    try {
      const [columns] = await db.promise().execute(
        "SHOW COLUMNS FROM document_types LIKE 'description'"
      );
      
      if (columns.length > 0) {
        // Description column exists
        insertQuery = 'INSERT INTO document_types (name, description) VALUES (?, ?)';
        insertParams = [name, description];
        selectQuery = 'SELECT type_id, name as type_name, description, created_at, updated_at FROM document_types WHERE type_id = ?';
      } else {
        // Description column doesn't exist
        insertQuery = 'INSERT INTO document_types (name) VALUES (?)';
        insertParams = [name];
        selectQuery = 'SELECT type_id, name as type_name, NULL as description, created_at, updated_at FROM document_types WHERE type_id = ?';
      }
    } catch (e) {
      // Fallback to basic insert
      insertQuery = 'INSERT INTO document_types (name) VALUES (?)';
      insertParams = [name];
      selectQuery = 'SELECT type_id, name as type_name, NULL as description, created_at, updated_at FROM document_types WHERE type_id = ?';
    }

    const [result] = await db.promise().execute(insertQuery, insertParams);

    const [newDocType] = await db.promise().execute(selectQuery, [result.insertId]);

    res.json({ 
      success: true, 
      message: 'Document type created successfully',
      documentType: newDocType[0]
    });
  } catch (error) {
    console.error('Error creating document type:', error);
    res.status(500).json({ success: false, message: 'Failed to create document type' });
  }
});

// Update document type
router.put('/document-types/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const name = (req.body?.type_name || req.body?.name || '').toString().trim();
    const description = (req.body?.description || '').toString().trim();
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Type name is required' });
    }

    // Check if trying to edit the protected "Unassigned" type
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit the protected "Unassigned" document type' 
      });
    }

    // Check if document type exists
    const [existing] = await db.promise().execute(
      'SELECT type_id FROM document_types WHERE type_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Document type not found' });
    }

    // Check if name is taken by another document type
    const [nameCheck] = await db.promise().execute(
      'SELECT type_id FROM document_types WHERE LOWER(name) = LOWER(?) AND type_id != ?',
      [name, id]
    );

    if (nameCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Document type name already exists' });
    }

    await db.promise().execute(
      'UPDATE document_types SET name = ?, description = ?, updated_at = NOW() WHERE type_id = ?',
      [name, description, id]
    );

    const [updatedDocType] = await db.promise().execute(
      'SELECT type_id, name as type_name, description, created_at, updated_at FROM document_types WHERE type_id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Document type updated successfully',
      documentType: updatedDocType[0]
    });
  } catch (error) {
    console.error('Error updating document type:', error);
    res.status(500).json({ success: false, message: 'Failed to update document type' });
  }
});

// Delete document type
router.delete('/document-types/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if document type exists
    const [existing] = await db.promise().execute(
      'SELECT type_id FROM document_types WHERE type_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Document type not found' });
    }

    // Check if trying to delete the protected "Unassigned" type
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the protected "Unassigned" document type' 
      });
    }

    // Get connection for transaction
    const connection = await db.promise().getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Check if document type is referenced by documents
      const [documentsCheck] = await connection.execute(
        'SELECT COUNT(*) as count FROM dms_documents WHERE doc_type = ? AND (deleted IS NULL OR deleted = 0)',
        [id]
      );

      // Only reassign if there are documents using this type
      if (documentsCheck[0].count > 0) {
        // Reassign all documents using this type to protected "Unassigned" (ID 999)
        await connection.execute(
          'UPDATE dms_documents SET doc_type = 999 WHERE doc_type = ? AND (deleted IS NULL OR deleted = 0)',
          [id]
        );
      }

      // Now delete the document type
      await connection.execute(
        'DELETE FROM document_types WHERE type_id = ?',
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
      message: 'Document type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document type' });
  }
});

// Get documents by document type
router.get('/document-types/:id/documents', requireAuth, async (req, res) => {
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
      WHERE d.doc_type = ? AND (d.deleted IS NULL OR d.deleted = 0)
      ORDER BY d.created_at DESC
      LIMIT ?`,
      [id, limit]
    );
    
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents by type:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

export default router;

// Admin-only: Normalize all document type names to Title Case
router.post('/document-types/normalize-case', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().execute('SELECT type_id, name FROM document_types');
    const seen = new Map(); // lower(name) -> type_id (first kept)
    const updates = [];
    const duplicates = [];
    for (const r of rows) {
      const current = r.name || '';
      const normalized = toTitleCase(current.trim());
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, r.type_id);
        if (normalized !== current) {
          updates.push({ id: r.type_id, name: normalized });
        }
      } else {
        // Duplicate by case only; record and skip update to avoid collision
        duplicates.push({ keep: seen.get(key), remove: r.type_id, name: normalized });
      }
    }

    for (const u of updates) {
      await db.promise().execute('UPDATE document_types SET name = ? WHERE type_id = ?', [u.name, u.id]);
    }

    return res.json({ success: true, updated: updates.length, duplicates });
  } catch (error) {
    console.error('Error normalizing document type names:', error);
    return res.status(500).json({ success: false, message: 'Failed to normalize document type names' });
  }
});
