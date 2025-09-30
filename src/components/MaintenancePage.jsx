import React, { useState, useEffect } from 'react';
import { FaTools, FaCog, FaServer, FaRedo, FaUserShield, FaEnvelope, FaPhone, FaSignOutAlt } from 'react-icons/fa';

const MaintenancePage = ({ isAdminView = false }) => {
  const [userRole, setUserRole] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear any local storage/session data if needed
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        // Force redirect anyway
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || null);
        }
      } catch (error) {
        setUserRole(null);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <FaTools size={64} color="#f59e0b" />
          </div>
          <h1 style={styles.title}>System Under Maintenance</h1>
          {(userRole === 'admin' || userRole === 'dean') ? (
            <div style={styles.adminNotice}>
              <FaUserShield size={20} color="#10b981" />
              <p style={styles.adminText}>
                Administrator Access: You can continue using the system during maintenance
              </p>
            </div>
          ) : (
            <p style={styles.subtitle}>
              We're currently performing scheduled maintenance to improve your experience
            </p>
          )}
        </div>

        {/* Status Section */}
        <div style={styles.statusCard}>
          <div style={styles.statusHeader}>
            <FaCog size={24} color="#6b7280" />
            <h3 style={styles.statusTitle}>Current Status</h3>
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>System Status:</span>
              <span style={styles.statusValue}>Under Maintenance</span>
            </div>
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>Current Time:</span>
              <span style={styles.statusValue}>{formatTime(currentTime)}</span>
            </div>
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>Estimated Duration:</span>
              <span style={styles.statusValue}>30-60 minutes</span>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <h4 style={styles.infoTitle}>What's Being Updated?</h4>
            <ul style={styles.infoList}>
              <li>Database optimization and backup procedures</li>
              <li>Security enhancements and updates</li>
              <li>Performance improvements</li>
              <li>Bug fixes and system stability</li>
            </ul>
          </div>

          <div style={styles.infoCard}>
            <h4 style={styles.infoTitle}>What to Expect</h4>
            <ul style={styles.infoList}>
              <li>All services will be temporarily unavailable</li>
              <li>Your data is safe and secure</li>
              <li>No action is required from your side</li>
              <li>System will automatically resume when complete</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div style={styles.contactCard}>
          <h4 style={styles.contactTitle}>Need Immediate Assistance?</h4>
          <p style={styles.contactDescription}>
            If you have urgent matters that cannot wait, please contact our support team:
          </p>
          <div style={styles.contactMethods}>
            <div style={styles.contactMethod}>
              <FaEnvelope size={20} color="#3b82f6" />
              <span style={styles.contactText}>support@ispsc.edu.ph</span>
            </div>
            <div style={styles.contactMethod}>
              <FaPhone size={20} color="#3b82f6" />
              <span style={styles.contactText}>+63 (077) 722-2324</span>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div style={styles.actionSection}>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.refreshButton}
              onClick={() => window.location.reload()}
            >
              <FaRedo size={20} />
              <span style={styles.refreshText}>Check Status</span>
            </button>
            
            <button 
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              <FaSignOutAlt size={20} />
              <span style={styles.logoutText}>Logout</span>
            </button>
          </div>
          <p style={styles.actionNote}>
            Check if maintenance is complete or logout to try a different account
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            ISPSc Document Management System
          </p>
          <p style={styles.footerSubtext}>
            Thank you for your patience while we improve our services
          </p>
        </div>
      </div>

      {/* Background Animation */}
      <div style={styles.backgroundAnimation}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.floatingIcon,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          >
            <FaTools size={16} color="rgba(245, 158, 11, 0.1)" />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '800px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    zIndex: 1
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 16px 0'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6'
  },
  statusCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid #e2e8f0'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  statusTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0'
  },
  statusLabel: {
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500'
  },
  statusValue: {
    fontSize: '16px',
    color: '#1f2937',
    fontWeight: '600'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  infoCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#6b7280'
  },
  contactCard: {
    background: '#eff6ff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid #dbeafe'
  },
  contactTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 12px 0'
  },
  contactDescription: {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 20px 0',
    lineHeight: '1.6'
  },
  contactMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  contactMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  contactText: {
    fontSize: '16px',
    color: '#1e40af',
    fontWeight: '500'
  },
  refreshSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  },
  refreshText: {
    fontSize: '16px'
  },
  refreshNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '12px 0 0 0'
  },
  actionSection: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    minWidth: '120px'
  },
  logoutText: {
    fontSize: '16px',
    fontWeight: '500'
  },
  actionNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '12px 0 0 0'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '32px',
    borderTop: '1px solid #e5e7eb'
  },
  footerText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  footerSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  adminNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#d1fae5',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #10b981',
    marginTop: '16px'
  },
  adminText: {
    fontSize: '16px',
    color: '#065f46',
    margin: 0,
    fontWeight: '500'
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden'
  },
  floatingIcon: {
    position: 'absolute',
    animation: 'float 15s infinite linear'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
  @keyframes float {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) rotate(360deg);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .maintenance-content {
      padding: 20px !important;
    }
    .maintenance-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default MaintenancePage;
