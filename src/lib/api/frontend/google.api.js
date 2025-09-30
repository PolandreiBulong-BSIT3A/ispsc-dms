import { API_BASE_URL } from './client.js';

export const googleAuth = () => {
  // Redirect to backend Google OAuth endpoint
  window.location.href = `${API_BASE_URL}/auth/google`;
};
