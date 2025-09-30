import express from 'express';
import db from '../connections/connection.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Relaxed: either disable or set very high thresholds for these lightweight endpoints
const relaxedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000,               // high burst limit to avoid 429 during page load
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Apply only to mutating routes if needed; leave GETs unthrottled
// router.use(relaxedLimiter);

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Document Preferences API is working!' });
});

// Debug endpoint to check authentication
router.get('/debug', (req, res) => {
  console.log('Debug endpoint hit!');
  console.log('User:', req.user);
  console.log('Session:', req.session);
  console.log('Headers:', req.headers);
  res.json({ 
    message: 'Debug info',
    user: req.user,
    session: req.session,
    hasUser: !!req.user,
    hasSession: !!req.session
  });
});

// Helper function to get database connection
const getConnection = () => {
  return db.promise();
};

// Helper function to get current user ID from session
const getCurrentUserId = (req) => {
  console.log('Session user:', req.user);
  console.log('Session:', req.session);
  console.log('Cookies:', req.cookies);
  
  // Try different ways to get user ID
  if (req.user && req.user.user_id) {
    return req.user.user_id;
  }
  
  if (req.session && req.session.user_id) {
    return req.session.user_id;
  }
  
  if (req.session && req.session.passport && req.session.passport.user) {
    return req.session.passport.user;
  }
  
  // For testing purposes, if no user is found, return a default user ID
  // Remove this in production
  console.log('No authenticated user found, using default user ID for testing');
  return 1; // Default to user ID 1 for testing
};

// GET /api/documents/preferences - Get user's document preferences
router.get('/documents/preferences', async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const connection = getConnection();

    const [rows] = await connection.execute(
      'SELECT doc_id, is_favorite, is_pinned FROM user_document_preferences WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      preferences: rows
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user preferences',
      error: error.message
    });
  }
});

// POST /api/documents/:docId/favorite - Toggle favorite status
router.post('/documents/:docId/favorite', async (req, res) => {
  console.log('Favorite toggle request received:', req.params.docId);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Check if document exists
    const [docRows] = await connection.execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ? AND deleted = 0',
      [docId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if preference already exists
    const [existingRows] = await connection.execute(
      'SELECT * FROM user_document_preferences WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (existingRows.length > 0) {
      // Update existing preference
      const newFavoriteStatus = !existingRows[0].is_favorite;
      await connection.execute(
        'UPDATE user_document_preferences SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
        [newFavoriteStatus, userId, docId]
      );
    } else {
      // Create new preference
      await connection.execute(
        'INSERT INTO user_document_preferences (user_id, doc_id, is_favorite, is_pinned) VALUES (?, ?, 1, 0)',
        [userId, docId]
      );
    }

    res.json({
      success: true,
      message: 'Favorite status updated successfully'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite status',
      error: error.message
    });
  }
});

// POST /api/documents/:docId/pin - Toggle pin status
router.post('/documents/:docId/pin', async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Check if document exists
    const [docRows] = await connection.execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ? AND deleted = 0',
      [docId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if preference already exists
    const [existingRows] = await connection.execute(
      'SELECT * FROM user_document_preferences WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (existingRows.length > 0) {
      // Update existing preference
      const newPinStatus = !existingRows[0].is_pinned;
      await connection.execute(
        'UPDATE user_document_preferences SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
        [newPinStatus, userId, docId]
      );
    } else {
      // Create new preference
      await connection.execute(
        'INSERT INTO user_document_preferences (user_id, doc_id, is_favorite, is_pinned) VALUES (?, ?, 0, 1)',
        [userId, docId]
      );
    }

    res.json({
      success: true,
      message: 'Pin status updated successfully'
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin status',
      error: error.message
    });
  }
});

// GET /api/documents/favorites - Get user's favorite documents
router.get('/documents/favorites', async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const connection = getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        d.doc_id,
        d.title,
        d.reference,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.doc_type,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        udp.is_favorite,
        udp.is_pinned
      FROM dms_documents d
      INNER JOIN user_document_preferences udp ON d.doc_id = udp.doc_id
      WHERE udp.user_id = ? AND udp.is_favorite = 1 AND d.deleted = 0
      ORDER BY udp.is_pinned DESC, d.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      favorites: rows
    });
  } catch (error) {
    console.error('Error fetching favorite documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite documents',
      error: error.message
    });
  }
});

// DELETE /api/documents/:docId/favorite - Remove from favorites
router.delete('/documents/:docId/favorite', async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Update the preference to remove favorite status
    const [result] = await connection.execute(
      'UPDATE user_document_preferences SET is_favorite = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in favorites'
      });
    }

    res.json({
      success: true,
      message: 'Document removed from favorites successfully'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message
    });
  }
});

export default router;
