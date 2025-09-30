// Document Preferences Client API
// Handles user-specific document preferences like favorites and pins

const BASE_URL = process.env.FRONTEND_BASE_API || 'http://localhost:5000/api';

// Get user's document preferences
export const fetchUserPreferences = async () => {
  try {
    const response = await fetch(`${BASE_URL}/documents/preferences`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user preferences');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

// Toggle favorite status for a document
export const toggleFavorite = async (docId) => {
  try {
    const response = await fetch(`${BASE_URL}/documents/${docId}/favorite`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle favorite status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Toggle pin status for a document
export const togglePin = async (docId) => {
  try {
    const response = await fetch(`${BASE_URL}/documents/${docId}/pin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle pin status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling pin:', error);
    throw error;
  }
};

// Get user's favorite documents
export const fetchFavoriteDocuments = async () => {
  try {
    const response = await fetch(`${BASE_URL}/documents/favorites`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch favorite documents');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching favorite documents:', error);
    throw error;
  }
};

// Remove document from favorites
export const removeFromFavorites = async (docId) => {
  try {
    const response = await fetch(`${BASE_URL}/documents/${docId}/favorite`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove from favorites');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};
