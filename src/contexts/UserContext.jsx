import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../lib/realtime/socket.js';
import { useNavigate } from 'react-router-dom';
import { buildUrl } from '../lib/api/frontend/client.js';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState({
    accessToken: null,
    refreshToken: null
  });

  // API base URL
  const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || buildUrl('');

  // Enhanced API request function with automatic token refresh
  const apiRequest = useCallback(async (url, options = {}) => {
    const config = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if we have an access token
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      // If token is expired, try to refresh it
      if (response.status === 401 && tokens.refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setTokens({
            accessToken: refreshData.tokens.accessToken,
            refreshToken: refreshData.tokens.refreshToken
          });

          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${refreshData.tokens.accessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${url}`, config);
          return retryResponse;
        } else {
          // Refresh failed, logout user
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }, [tokens]);

  // Load user data from session/JWT via API
  const loadUser = useCallback(async () => {
    try {
      const response = await apiRequest('/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          // Restore profile picture from localStorage if not present in API response
          const storedProfilePic = localStorage.getItem('userProfilePic');
          if (storedProfilePic && !userData.user.profilePic) {
            userData.user.profilePic = storedProfilePic;
          }
          
          setUser(userData.user);
          return userData.user;
        }
      }
      
      // If no valid session, redirect to login
      navigate('/login');
      return null;
    } catch (error) {
      console.error('Error loading user from session:', error);
      navigate('/login');
      return null;
    }
  }, [apiRequest, navigate]);

  // Update user data with profile picture preservation
  const updateUser = useCallback((newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      
      // Preserve profile picture data during updates
      if (user?.profilePic && !newUserData.profilePic) {
        updatedUser.profilePic = user.profilePic;
      }
      
      setUser(updatedUser);
      
      // Persist profile picture in localStorage for reliability
      if (updatedUser.profilePic) {
        localStorage.setItem('userProfilePic', updatedUser.profilePic);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      return null;
    }
  }, [user]);

  // Refresh user data from server with profile picture preservation
  const refreshUser = useCallback(async () => {
    try {
      const currentProfilePic = user?.profilePic;
      const refreshedUser = await loadUser();
      
      // If profile picture was lost during refresh, restore it
      if (currentProfilePic && refreshedUser && !refreshedUser.profilePic) {
        refreshedUser.profilePic = currentProfilePic;
        setUser(refreshedUser);
        localStorage.setItem('userProfilePic', currentProfilePic);
      }
      
      return refreshedUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  }, [loadUser, user?.profilePic]);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API to destroy session and clear tokens
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Disconnect realtime socket on explicit logout
      try { socket.disconnect(); } catch {}
      // Clear local state
      setUser(null);
      setTokens({ accessToken: null, refreshToken: null });
      
      // Clear all stored tokens and data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userProfilePic');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      
      // Redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    if (!user?.role) return false;
    const userRole = user.role.toString().toLowerCase();
    const required = requiredRole.toString().toLowerCase();
    return userRole === required;
  }, [user]);

  // Check if user has admin privileges
  const hasAdminPrivileges = useCallback(() => {
    if (!user?.role) return false;
    const role = user.role.toString().toLowerCase();
    return role === 'admin' || role === 'administrator' || role === 'dean';
  }, [user]);

  // Check if user has dean privileges
  const hasDeanPrivileges = useCallback(() => {
    if (!user?.role) return false;
    const role = user.role.toString().toLowerCase();
    return role === 'dean' || role === 'admin' || role === 'administrator';
  }, [user]);

  // Handle successful login
  const handleLoginSuccess = useCallback((userData, loginTokens, rememberMe = false) => {
    // Preserve profile picture from localStorage if available
    const storedProfilePic = localStorage.getItem('userProfilePic');
    if (storedProfilePic && !userData.profilePic) {
      userData.profilePic = storedProfilePic;
    }
    
    setUser(userData);
    if (loginTokens) {
      setTokens({
        accessToken: loginTokens.accessToken,
        refreshToken: loginTokens.refreshToken
      });
      
      // Store tokens in localStorage for persistence if remember me is checked
      if (rememberMe) {
        localStorage.setItem('accessToken', loginTokens.accessToken);
        localStorage.setItem('refreshToken', loginTokens.refreshToken);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', userData.email || '');
        // Preserve profile picture in localStorage
        if (userData.profilePic) {
          localStorage.setItem('userProfilePic', userData.profilePic);
        }
      } else {
        // Store only in sessionStorage for session-only persistence
        sessionStorage.setItem('accessToken', loginTokens.accessToken);
        sessionStorage.setItem('refreshToken', loginTokens.refreshToken);
        // Clear any existing localStorage tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
        // But keep profile picture in localStorage for reliability
        if (userData.profilePic) {
          localStorage.setItem('userProfilePic', userData.profilePic);
        }
      }
    }
  }, []);

  // Initialize tokens from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (storedAccessToken && storedRefreshToken && rememberMe === 'true') {
      setTokens({
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken
      });
    } else {
      // Check sessionStorage for session-only tokens
      const sessionAccessToken = sessionStorage.getItem('accessToken');
      const sessionRefreshToken = sessionStorage.getItem('refreshToken');
      
      if (sessionAccessToken && sessionRefreshToken) {
        setTokens({
          accessToken: sessionAccessToken,
          refreshToken: sessionRefreshToken
        });
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  // Periodic refresh to keep session alive and check for role changes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Periodic refresh failed:', error);
        // If refresh fails, logout user
        await logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [user, refreshUser, logout]);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!tokens.accessToken) return;

    const tokenRefreshInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTokens({
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken
          });
          
          // Store tokens in the appropriate storage based on remember me setting
          const rememberMe = localStorage.getItem('rememberMe');
          if (rememberMe === 'true') {
            localStorage.setItem('accessToken', data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
          } else {
            sessionStorage.setItem('accessToken', data.tokens.accessToken);
            sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
          }
        }
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, 20 * 60 * 1000); // Refresh every 20 minutes (tokens expire in 24 hours)

    return () => clearInterval(tokenRefreshInterval);
  }, [tokens.accessToken]);

  const value = {
    user,
    loading,
    tokens,
    updateUser,
    refreshUser,
    logout,
    hasRole,
    hasAdminPrivileges,
    hasDeanPrivileges,
    loadUser,
    handleLoginSuccess,
    apiRequest
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
