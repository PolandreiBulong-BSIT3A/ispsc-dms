// Frontend client for document preferences (favorites, pins)
// Uses shared client helpers for base URL and JSON handling
import { buildUrl, fetchJson } from './client.js';

// Fetch user's preferences (if needed elsewhere)
export const fetchUserPreferences = async () => {
  return fetchJson(buildUrl('/documents/preferences'));
};

export const fetchFavoriteDocuments = async () => {
  return fetchJson(buildUrl('/documents/favorites'));
};

export const toggleFavorite = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/favorite`), {
    method: 'POST'
  });
};

export const removeFromFavorites = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/favorite`), {
    method: 'DELETE'
  });
};

export const togglePin = async (docId) => {
  return fetchJson(buildUrl(`/documents/${docId}/pin`), {
    method: 'POST'
  });
};
