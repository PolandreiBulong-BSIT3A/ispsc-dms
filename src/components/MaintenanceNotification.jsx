import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaUserShield } from 'react-icons/fa';

const MaintenanceNotification = ({ isAdmin = false, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.notification}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            {isAdmin ? (
              <FaUserShield size={24} color="#10b981" />
            ) : (
              <FaExclamationTriangle size={24} color="#f59e0b" />
            )}
          </div>
          <button style={styles.closeButton} onClick={handleDismiss}>
            <FaTimes size={16} />
          </button>
        </div>
        
        <div style={styles.content}>
          <h3 style={styles.title}>
            {isAdmin ? 'Maintenance Mode Active' : 'System Maintenance Notice'}
          </h3>
          
          {isAdmin ? (
            <div>
              <p style={styles.message}>
                Maintenance mode has been enabled. You have administrator access and can continue using the system.
              </p>
              <p style={styles.submessage}>
                Regular users are now seeing the maintenance page.
              </p>
            </div>
          ) : (
            <div>
              <p style={styles.message}>
                The system has entered maintenance mode. You will be redirected to the maintenance page shortly.
              </p>
              <p style={styles.submessage}>
                Please save any unsaved work immediately.
              </p>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          {isAdmin ? (
            <button style={styles.continueButton} onClick={handleDismiss}>
              Continue Working
            </button>
          ) : (
            <button style={styles.redirectButton} onClick={() => window.location.reload()}>
              Go to Maintenance Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)'
  },
  notification: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: '#6b7280',
    transition: 'background-color 0.2s'
  },
  content: {
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0'
  },
  message: {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 8px 0',
    lineHeight: '1.5'
  },
  submessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.4'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  continueButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  redirectButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default MaintenanceNotification;
