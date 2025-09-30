import React, { useMemo } from 'react';
import { FiLayout, FiUser, FiFileText, FiUpload, FiUsers, FiBarChart2, FiDatabase, FiSettings, FiFolder, FiStar, FiAlertCircle, FiX } from 'react-icons/fi';
import './sidebar.css';
import Logo from '../../../assets/logos/logo.png';
import { useDocuments } from '../../../contexts/DocumentContext.jsx';
import { useUser } from '../../../contexts/UserContext.jsx';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, role, isMobile }) => {
  const { documents } = useDocuments();
  const { currentUser } = useUser();

  // Detect action-required docs (for faculty visibility)
  const facultyRequestCount = useMemo(() => {
    const isActionRequiredDoc = (doc) => {
      const arArray = doc.action_required || doc.actionRequired || doc.actions || [];
      const arName = doc.action_required_name || doc.actionName || '';
      const arIds = doc.action_required_ids || [];
      return (Array.isArray(arArray) && arArray.length > 0) || !!arName || (Array.isArray(arIds) && arIds.length > 0);
    };
    const isForFaculty = (doc) => {
      // Heuristic: document is visible to ALL or to user's department/role
      const visibleAll = doc.visible_to_all === 1 || doc.visible_to_all === true;
      const inDept = (doc.department_ids || '').toString().split(',').map(s => s.trim()).includes((currentUser?.department_id || '').toString());
      return visibleAll || inDept;
    };
    return documents.filter(d => isActionRequiredDoc(d) && isForFaculty(d)).length;
  }, [documents, currentUser]);

  // User menu (limited access)
  const userMenu = [
    { type: 'section', label: 'Home', key: 'home-section' },
    { key: 'dashboard', label: 'Dashboard', icon: <FiLayout /> },
    { type: 'section', label: 'Management', key: 'management-section' },
    { key: 'documents', label: 'Documents', icon: <FiFileText /> },
    // Always show Requests for faculty; they may be assigned tasks
    { key: 'requests', label: 'Requests', icon: <FiAlertCircle /> },
    // Show Users (view-only for faculty) so they can browse profiles
    { key: 'admin-user', label: 'Users', icon: <FiUsers /> },
    { key: 'favorites', label: 'Favorites', icon: <FiStar /> },
    { type: 'section', label: 'Personal', key: 'personal-section' },
    { key: 'profile', label: 'Profile', icon: <FiUser /> },
  ];

  // Admin and Dean menu (full access)
  const adminDeanMenu = [
    { type: 'section', label: 'Home', key: 'home-section' },
    { key: 'dashboard', label: 'Dashboard', icon: <FiLayout /> },
    { type: 'section', label: 'Management', key: 'management-section' },
    { key: 'upload', label: 'Upload', icon: <FiUpload /> },
    { key: 'admin-user', label: 'Users', icon: <FiUsers /> },
    { key: 'documents', label: 'Documents', icon: <FiFileText /> },
    { key: 'requests', label: 'Requests', icon: <FiAlertCircle /> },
    { key: 'favorites', label: 'Favorites', icon: <FiStar /> },
    { type: 'section', label: 'Administration', key: 'admin-section' },
    { key: 'admin', label: 'Admin Panel', icon: <FiSettings /> },
    { type: 'section', label: 'Analytics', key: 'analytics-section' },
    { key: 'reports', label: 'Reports', icon: <FiBarChart2 /> },
    { type: 'section', label: 'Personal', key: 'personal-section' },
    { key: 'profile', label: 'Profile', icon: <FiUser /> },
  ];

  // Default menu (for other roles)
  const defaultMenu = [
    { key: 'dashboard', label: 'Dashboard', icon: <FiLayout /> },
    { key: 'structure', label: 'Structure', icon: <FiDatabase /> },
    { key: 'settings', label: 'Settings', icon: <FiSettings /> },
  ];

  const normalizedRole = (role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';
      const isDean = normalizedRole === 'dean';
      const isUser = normalizedRole === 'faculty';
  let menu;
  if (isAdmin || isDean) {
    menu = adminDeanMenu;
  } else if (isUser) {
    menu = userMenu;
  } else {
    menu = defaultMenu;
  }

  return (
    <div 
      className="sidebar" 
      style={{
        width: sidebarOpen ? '250px' : '70px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 2000,
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        background: '#fff',
        transition: 'transform 0.25s ease',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)'
      }}
    >
      <div className="sidebar-header" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: 'white', zIndex: 2100, padding: '0 20px' }}>
        <div className="logo-container" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Full text logo */}
          {sidebarOpen ? (
            <h2 className="full-logo">
              <span className="logo-primary">ISPSC </span>
              <span className="logo-secondary">TAGUDIN CAMPUS</span>
            </h2>
          ) : (
            <div className="mini-logo">
              <img 
                src={Logo}
                alt="ISPSC Logo" 
                className="logo-image"
              />
            </div>
          )}
        </div>
        {/* Close button for mobile */}
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close menu"
          >
            <FiX size={20} color="#64748b" />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menu.map(item => (
            item.type === 'section' ? (
              // Section Header
              <li
                key={item.key}
                className="nav-section-header"
                style={{
                  padding: sidebarOpen ? '16px 20px 8px 20px' : '16px 0 8px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  cursor: 'default',
                  borderBottom: sidebarOpen ? '1px solid #e2e8f0' : 'none',
                  marginBottom: sidebarOpen ? '8px' : '4px'
                }}
              >
                {sidebarOpen && (
                  <span 
                    className="section-text"
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {!sidebarOpen && (
                  <div 
                    className="section-indicator"
                    style={{
                      width: '4px',
                      height: '4px',
                      backgroundColor: '#9ca3af',
                      borderRadius: '50%'
                    }}
                  />
                )}
              </li>
            ) : (
              // Regular Menu Item
              <li
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                style={{
                  padding: sidebarOpen ? '12px 20px' : '12px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
                onClick={() => setActiveTab(item.key)}
              >
                {React.cloneElement(item.icon, {
                  className: 'nav-icon',
                  style: { marginRight: sidebarOpen ? '12px' : 0 }
                })}
                {sidebarOpen && <span className="nav-text">{item.label}</span>}
                {!sidebarOpen && activeTab === item.key && (
                  <div className="active-indicator"></div>
                )}
              </li>
            )
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;