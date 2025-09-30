import React, { useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';

const ProfilePicture = ({ 
  src, 
  alt = "Profile", 
  size = 32, 
  className = "", 
  style = {},
  fallbackText = null,
  onError = null,
  onLoad = null
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src]);

  const handleError = (e) => {
    console.warn('Profile picture failed to load:', src);
    setImageError(true);
    if (onError) onError(e);
  };

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const defaultStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    ...style
  };

  const fallbackStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6c757d',
    fontSize: Math.max(12, size * 0.4),
    fontWeight: '600',
    ...style
  };

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div className={className} style={fallbackStyle}>
        {fallbackText ? (
          fallbackText
        ) : (
          <FiUser size={Math.max(16, size * 0.5)} />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={defaultStyle}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default ProfilePicture;
