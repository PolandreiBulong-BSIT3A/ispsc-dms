import express from 'express';
import db from '../connections/connection.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
const toTitleCase = (s) => {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m, p1) => p1.toUpperCase());
};

// Get all folders
router.get('/folders', requireAuth, async (req, res) => {
  try {
    // Get folders with document count
    const [folders] = await db.promise().execute(
      `SELECT 
        f.folder_id, 
        f.name, 
        f.created_at, 
        f.updated_at,
        COUNT(d.doc_id) as document_count
      FROM folders f
      LEFT JOIN dms_documents d ON d.folder_id = f.folder_id AND (d.deleted IS NULL OR d.deleted = 0)
      GROUP BY f.folder_id, f.name, f.created_at, f.updated_at
      ORDER BY f.name`
    );
    
    res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders'
    });
  }
});

// Create new folder
router.post('/folders', requireAuth, requireRole(['admin', 'dean']), async (req, res) => {
  try {
    const nameInput = req.body?.name;
    const name = toTitleCase((nameInput || '').toString().trim());
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Check if folder already exists
    const [existing] = await db.promise().execute(
      'SELECT folder_id FROM folders WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Folder with this name already exists'
      });
    }

    const [result] = await db.promise().execute(
      'INSERT INTO folders (name) VALUES (?)',
      [name]
    );

    res.json({
      success: true,
      message: 'Folder created successfully',
      folder: {
        folder_id: result.insertId,
        name
      }
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
});

// Move single document to folder
router.put('/documents/:id/folder', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { folder } = req.body;
    
    if (!folder) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Verify document exists and user has permission
    const [documents] = await db.promise().execute(
      'SELECT doc_id, created_by_user_id FROM dms_documents WHERE doc_id = ? AND deleted = 0',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission (admin, dean, or document owner)
    const doc = documents[0];
    console.log('Full user object:', JSON.stringify(req.user, null, 2));
    
    // Fix permission check based on actual user object structure
    // Check multiple possible property names for role and user ID
    const userRole = req.user.role || req.user.Role || req.user.user_role;
    const userId = req.user.user_id || req.user.id || req.user.userId;
    
    console.log('Detected role:', userRole);
    console.log('Detected user ID:', userId);
    console.log('Document created by:', doc.created_by_user_id);
    
    const hasPermission = userRole?.toLowerCase() === 'admin' || 
                         userRole?.toLowerCase() === 'dean' || 
                         doc.created_by_user_id === userId;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to move this document'
      });
    }

    // Get folder_id from folder name
    const [folderResult] = await db.promise().execute(
      'SELECT folder_id FROM folders WHERE name = ?',
      [folder]
    );

    if (folderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Update document primary folder
    await db.promise().execute(
      'UPDATE dms_documents SET folder_id = ? WHERE doc_id = ?',
      [folderResult[0].folder_id, id]
    );

    // Sync multi-folder join table: append target folder, avoid duplicates
    try {
      await db.promise().execute(
        `INSERT INTO document_folders (doc_id, folder_id)
         SELECT ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM document_folders WHERE doc_id = ? AND folder_id = ?
         )`,
        [id, folderResult[0].folder_id, id, folderResult[0].folder_id]
      );
    } catch (e) {
      console.warn('document_folders sync failed (single move append):', e?.message || e);
    }

    res.json({
      success: true,
      message: 'Document moved successfully'
    });
  } catch (error) {
    console.error('Error moving document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move document'
    });
  }
});

// Move multiple documents to folder (mass operation)
router.put('/documents/bulk/folder', requireAuth, async (req, res) => {
  console.log('Bulk folder endpoint hit with body:', req.body);
  try {
    const { documentIds, folder } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // Get folder_id from folder name
    const [folderResult] = await db.promise().execute(
      'SELECT folder_id FROM folders WHERE name = ?',
      [folder]
    );

    if (folderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Verify all documents exist and user has permission
    const placeholders = documentIds.map(() => '?').join(',');
    const [documents] = await db.promise().execute(
      `SELECT doc_id, created_by_user_id, title FROM dms_documents WHERE doc_id IN (${placeholders}) AND deleted = 0`,
      documentIds
    );

    if (documents.length !== documentIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more documents not found'
      });
    }

    // Check permissions for each document
    const userRole = req.user.role || req.user.Role || req.user.user_role;
    const userId = req.user.user_id || req.user.id || req.user.userId;
    
    const unauthorizedDocs = documents.filter(doc => {
      return userRole?.toLowerCase() !== 'admin' && 
             userRole?.toLowerCase() !== 'dean' && 
             doc.created_by_user_id !== userId;
    });

    if (unauthorizedDocs.length > 0) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to move ${unauthorizedDocs.length} document(s)`
      });
    }

    // Update all documents (primary folder)
    await db.promise().execute(
      `UPDATE dms_documents SET folder_id = ? WHERE doc_id IN (${placeholders})`,
      [folderResult[0].folder_id, ...documentIds]
    );

    // Sync multi-folder join table for all moved docs: append target folder, avoid duplicates
    try {
      for (const did of documentIds) {
        await db.promise().execute(
          `INSERT INTO document_folders (doc_id, folder_id)
           SELECT ?, ?
           WHERE NOT EXISTS (
             SELECT 1 FROM document_folders WHERE doc_id = ? AND folder_id = ?
           )`,
          [did, folderResult[0].folder_id, did, folderResult[0].folder_id]
        );
      }
    } catch (e) {
      console.warn('document_folders sync failed (bulk move append):', e?.message || e);
    }

    res.json({
      success: true,
      message: `${documents.length} document(s) moved successfully`,
      movedCount: documents.length
    });
  } catch (error) {
    console.error('Error moving documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move documents'
    });
  }
});

// Update folder (admin only)
router.put('/folders/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const name = (req.body?.name || '').toString().trim();
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Folder name is required' });
    }

    // Check if trying to edit the protected "Unassigned" folder
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit the protected "Unassigned" folder' 
      });
    }

    // Check if folder exists
    const [existing] = await db.promise().execute(
      'SELECT folder_id FROM folders WHERE folder_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Check if name is taken by another folder
    const [nameCheck] = await db.promise().execute(
      'SELECT folder_id FROM folders WHERE LOWER(name) = LOWER(?) AND folder_id != ?',
      [name, id]
    );

    if (nameCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Folder name already exists' });
    }

    await db.promise().execute(
      'UPDATE folders SET name = ?, updated_at = NOW() WHERE folder_id = ?',
      [name, id]
    );

    res.json({ 
      success: true, 
      message: 'Folder updated successfully'
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ success: false, message: 'Failed to update folder' });
  }
});

// Delete folder (admin only)
router.delete('/folders/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if trying to delete the protected "Unassigned" folder
    if (id == 999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the protected "Unassigned" folder' 
      });
    }

    // Get connection for transaction
    const connection = await db.promise().getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Check if folder has documents
      const [documents] = await connection.execute(
        'SELECT COUNT(*) as count FROM dms_documents WHERE folder_id = ? AND (deleted IS NULL OR deleted = 0)',
        [id]
      );

      // Only reassign if there are documents in this folder
      if (documents[0].count > 0) {
        // Reassign all documents in this folder to protected "Unassigned" (ID 999)
        await connection.execute(
          'UPDATE dms_documents SET folder_id = 999 WHERE folder_id = ? AND (deleted IS NULL OR deleted = 0)',
          [id]
        );

        // Also update the document_folders junction table
        await connection.execute(
          'UPDATE document_folders SET folder_id = 999 WHERE folder_id = ?',
          [id]
        );
      }

      // Now delete the folder
      await connection.execute('DELETE FROM folders WHERE folder_id = ?', [id]);

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
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder'
    });
  }
});

// Get documents by folder
router.get('/folders/:id/documents', requireAuth, async (req, res) => {
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
      WHERE d.folder_id = ? AND (d.deleted IS NULL OR d.deleted = 0)
      ORDER BY d.created_at DESC
      LIMIT ?`,
      [id, limit]
    );
    
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents by folder:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

// Get folders for a specific document
router.get('/documents/:id/folders', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [folders] = await db.promise().execute(
      `SELECT f.folder_id, f.name, df.created_at as assigned_at
       FROM document_folders df
       JOIN folders f ON df.folder_id = f.folder_id
       WHERE df.doc_id = ?
       ORDER BY f.name ASC`,
      [id]
    );
    
    res.json({ success: true, folders });
  } catch (error) {
    console.error('Error fetching document folders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document folders' });
  }
});

// Add document to multiple folders
router.post('/documents/:id/folders', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { folderIds } = req.body; // Array of folder IDs
    
    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'folderIds must be a non-empty array' });
    }
    
    // Check if document exists
    const [docCheck] = await db.promise().execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ?',
      [id]
    );
    
    if (docCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Validate all folder IDs exist
    const [folderCheck] = await db.promise().execute(
      `SELECT folder_id FROM folders WHERE folder_id IN (${folderIds.map(() => '?').join(',')})`,
      folderIds
    );
    
    if (folderCheck.length !== folderIds.length) {
      return res.status(400).json({ success: false, message: 'One or more folder IDs are invalid' });
    }
    
    // Insert document-folder relationships (ignore duplicates)
    const values = folderIds.map(folderId => [id, folderId]);
    const placeholders = values.map(() => '(?, ?)').join(',');
    
    await db.promise().execute(
      `INSERT IGNORE INTO document_folders (doc_id, folder_id) VALUES ${placeholders}`,
      values.flat()
    );
    
    res.json({ 
      success: true, 
      message: `Document added to ${folderIds.length} folder(s)`,
      documentId: id,
      folderIds
    });
  } catch (error) {
    console.error('Error adding document to folders:', error);
    res.status(500).json({ success: false, message: 'Failed to add document to folders' });
  }
});

// Remove document from specific folders
router.delete('/documents/:id/folders', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { folderIds } = req.body; // Array of folder IDs to remove
    
    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'folderIds must be a non-empty array' });
    }
    
    const [result] = await db.promise().execute(
      `DELETE FROM document_folders 
       WHERE doc_id = ? AND folder_id IN (${folderIds.map(() => '?').join(',')})`,
      [id, ...folderIds]
    );
    
    res.json({ 
      success: true, 
      message: `Document removed from ${result.affectedRows} folder(s)`,
      documentId: id,
      removedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error removing document from folders:', error);
    res.status(500).json({ success: false, message: 'Failed to remove document from folders' });
  }
});

// Update document folders (replace all current folder assignments)
router.put('/documents/:id/folders', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { folderIds } = req.body; // Array of folder IDs (can be empty to remove from all folders)
    
    if (!Array.isArray(folderIds)) {
      return res.status(400).json({ success: false, message: 'folderIds must be an array' });
    }
    
    // Check if document exists
    const [docCheck] = await db.promise().execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ?',
      [id]
    );
    
    if (docCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Start transaction
    await db.promise().execute('START TRANSACTION');
    
    try {
      // Remove all current folder assignments
      await db.promise().execute(
        'DELETE FROM document_folders WHERE doc_id = ?',
        [id]
      );
      
      // Add new folder assignments if any
      if (folderIds.length > 0) {
        // Validate all folder IDs exist
        const [folderCheck] = await db.promise().execute(
          `SELECT folder_id FROM folders WHERE folder_id IN (${folderIds.map(() => '?').join(',')})`,
          folderIds
        );
        
        if (folderCheck.length !== folderIds.length) {
          await db.promise().execute('ROLLBACK');
          return res.status(400).json({ success: false, message: 'One or more folder IDs are invalid' });
        }
        
        // Insert new assignments
        const values = folderIds.map(folderId => [id, folderId]);
        const placeholders = values.map(() => '(?, ?)').join(',');
        
        await db.promise().execute(
          `INSERT INTO document_folders (doc_id, folder_id) VALUES ${placeholders}`,
          values.flat()
        );
      }
      
      await db.promise().execute('COMMIT');
      
      res.json({ 
        success: true, 
        message: `Document folder assignments updated`,
        documentId: id,
        folderIds
      });
    } catch (error) {
      await db.promise().execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating document folders:', error);
    res.status(500).json({ success: false, message: 'Failed to update document folders' });
  }
});

export default router;

// Admin-only: Normalize all folder names to Title Case
router.post('/folders/normalize-case', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.promise().execute('SELECT folder_id, name FROM folders');
    const seen = new Map(); // lower(name) -> folder_id (first kept)
    const updates = [];
    const duplicates = [];
    for (const r of rows) {
      const current = r.name || '';
      const normalized = toTitleCase(current.trim());
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, r.folder_id);
        if (normalized !== current) {
          updates.push({ id: r.folder_id, name: normalized });
        }
      } else {
        // Duplicate by case only; record and skip update to avoid collision
        duplicates.push({ keep: seen.get(key), remove: r.folder_id, name: normalized });
      }
    }

    for (const u of updates) {
      await db.promise().execute('UPDATE folders SET name = ? WHERE folder_id = ?', [u.name, u.id]);
    }

    return res.json({ success: true, updated: updates.length, duplicates });
  } catch (error) {
    console.error('Error normalizing folder names:', error);
    return res.status(500).json({ success: false, message: 'Failed to normalize folder names' });
  }
});
