import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing profile pictures with persistence and error handling
 */
export const useProfilePicture = (user) => {
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load profile picture from user data or localStorage
  useEffect(() => {
    if (user?.profilePic) {
      setProfilePic(user.profilePic);
      // Persist in localStorage for reliability
      localStorage.setItem('userProfilePic', user.profilePic);
    } else {
      // Try to restore from localStorage
      const storedPic = localStorage.getItem('userProfilePic');
      if (storedPic) {
        setProfilePic(storedPic);
      }
    }
  }, [user?.profilePic]);

  // Update profile picture
  const updateProfilePicture = useCallback((newPic) => {
    setProfilePic(newPic);
    if (newPic) {
      localStorage.setItem('userProfilePic', newPic);
    } else {
      localStorage.removeItem('userProfilePic');
    }
  }, []);

  // Clear profile picture
  const clearProfilePicture = useCallback(() => {
    setProfilePic(null);
    localStorage.removeItem('userProfilePic');
  }, []);

  // Get profile picture with fallback
  const getProfilePicture = useCallback(() => {
    return profilePic || localStorage.getItem('userProfilePic') || null;
  }, [profilePic]);

  // Check if profile picture is valid
  const isValidProfilePicture = useCallback((pic) => {
    if (!pic) return false;
    
    // Check if it's a data URL (base64)
    if (pic.startsWith('data:image/')) return true;
    
    // Check if it's a valid URL
    if (pic.startsWith('http://') || pic.startsWith('https://')) return true;
    
    // Check if it's a local asset path
    if (pic.startsWith('/') || pic.startsWith('./') || pic.startsWith('../')) return true;
    
    return false;
  }, []);

  return {
    profilePic: getProfilePicture(),
    isLoading,
    error,
    updateProfilePicture,
    clearProfilePicture,
    isValidProfilePicture,
    setError
  };
};

export default useProfilePicture;
