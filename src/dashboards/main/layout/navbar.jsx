import React, { useState, useEffect } from 'react';
import { FiSearch, FiBell, FiUser, FiSettings, FiLogOut, FiX, FiRefreshCw, FiCheck, FiEye } from 'react-icons/fi';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useUser } from '../../../contexts/UserContext';
import ProfilePicture from '../../../components/ProfilePicture';
import Logo from '../../../assets/logos/logo.png';

const Navbar = ({ sidebarOpen, role, setRole, setSidebarOpen, isMobile }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(true);
  const [departmentName, setDepartmentName] = useState('');
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotificationSession, refreshNotificationsImmediately } = useNotifications();
  const { user, logout } = useUser();

  // Debug: Log notifications whenever they change
  useEffect(() => {
    console.log('Navbar notifications updated:', notifications);
    console.log('Notifications length:', notifications.length);
    console.log('Notifications array:', notifications);
  }, [notifications]);

  // Set department name from user context
  useEffect(() => {
    console.log('Navbar user object:', user);
    if (user?.department_name) {
      setDepartmentName(user.department_name);
    } else {
      setDepartmentName('');
    }
  }, [user?.department_name]);



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-container') && !event.target.closest('.notification-container')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };



  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div className="navbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left: Logo for mobile */}
        {isMobile && (
          <button
            className="mobile-logo-btn"
            onClick={() => setSidebarOpen && setSidebarOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              marginLeft: 12,
              cursor: 'pointer'
            }}
          >
            <img 
              src={Logo}
              alt="ISPSC Logo" 
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          </button>
        )}

        {/* Right Side Actions */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>

          


          {/* Notifications */}
          <div className="notification-container">
            <button 
              className={`notification-btn ${unreadCount > 0 ? 'has-notifications' : 'no-notifications'}`}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  setShowAllNotifications(true); // Always show all notifications when opening
                }
              }}
              title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
              data-tooltip={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`}
              data-count={unreadCount}
            >
              <div className="notification-icon-wrapper">
                <FiBell className="notification-icon" />
                {unreadCount > 0 && (
                  <div className="notification-pulse-ring"></div>
                )}
              </div>
              {unreadCount > 0 && (
                <span className={`notification-badge ${unreadCount > 9 ? 'high-count' : ''} ${unreadCount > 99 ? 'critical' : ''}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Off-Canvas */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div 
                  className="notification-backdrop"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Off-Canvas Panel */}
                <div className="notification-offcanvas">
                  <div className="notification-header">
                    <div className="notification-header-left">
                      <div className="notification-header-title">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="notification-unread-count">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="notification-header-actions">
                      {unreadCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={() => markAllAsRead()}
                          title="Mark all notifications as read"
                        >
                          <FiCheck size={14} />
                          Mark all read
                        </button>
                      )}
                      <button 
                        className="refresh-btn"
                        onClick={() => {
                          refreshNotificationsImmediately();
                          console.log('Refreshing notifications...');
                        }}
                        title="Refresh notifications"
                      >
                        <FiRefreshCw size={14} />
                      </button>
                      <button 
                        className="notification-close"
                        onClick={() => setShowNotifications(false)}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Notification Filter Tabs */}
                  <div className="notification-filters">
                    <button 
                      className={`filter-btn ${showAllNotifications ? 'active' : ''}`}
                      onClick={() => setShowAllNotifications(true)}
                    >
                      All ({notifications.length})
                    </button>
                    <button 
                      className={`filter-btn ${!showAllNotifications ? 'active' : ''}`}
                      onClick={() => setShowAllNotifications(false)}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <div className="empty-icon">
                          <FiBell size={48} />
                        </div>
                        <h4>No notifications yet</h4>
                        <p>We'll notify you when something important happens</p>
                      </div>
                    ) : (
                      <>
                        {notifications
                          .filter(notification => showAllNotifications || !notification.is_read)
                          .map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="notification-indicator">
                                {!notification.is_read && <div className="unread-dot"></div>}
                              </div>
                              <div className="notification-content">
                                <div className="notification-header-item">
                                  <h4>{notification.title}</h4>
                                  <span className="notification-time">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                <div className="notification-meta">
                                  <span className={`notification-type ${notification.type}`}>
                                    {notification.type}
                                  </span>
                                  {notification.related_doc_id && (
                                    <span className="notification-related">
                                      Related to document
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="notification-actions">
                                <button 
                                  className="notification-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                                >
                                  {notification.is_read ? <FiEye size={14} /> : <FiCheck size={14} />}
                                </button>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <div className="notification-count">
                        Showing all {notifications.length} notifications
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="user-container">
            <button 
              className="user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <ProfilePicture
                  src={user?.profilePic}
                  alt="Profile"
                  size={32}
                  className="user-profile-pic"
                  fallbackText={user?.firstname && user?.lastname ? 
                    `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase() : 
                    null
                  }
                />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.Username || user?.username || 'User'}</span>
                <span className="user-role">
                  {user?.role || role}
                  {departmentName ? ` | ${departmentName}` : ''}
                </span>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <ProfilePicture
                      src={user?.profilePic}
                      alt="Profile"
                      size={40}
                      className="dropdown-user-pic"
                      fallbackText={user?.firstname && user?.lastname ? 
                        `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase() : 
                        null
                      }
                    />
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{user?.Username || user?.username || 'User'}</span>
                    <span className="dropdown-email">{user?.email || user?.user_email || ''}</span>
                  </div>
                </div>
                <div className="dropdown-menu">
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut className="dropdown-item-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 