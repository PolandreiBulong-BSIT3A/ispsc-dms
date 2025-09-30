import React, { useState, useEffect } from 'react';
import { Row, Col, Nav, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import Announcements from './Announcements.jsx';
import './Dashboard.css';
import { useUser } from '../../contexts/UserContext.jsx';
import { buildUrl, fetchJson, fetchWithRetry } from '../../lib/api/frontend/client.js';
import { 
  FiUsers, 
  FiFileText, 
  FiBarChart, 
  FiBell, 
  FiSpeaker,
  FiRefreshCw,
  FiEye,
  FiPlus,
  FiX,
  FiClipboard
} from 'react-icons/fi';

// Create aliases for modal icons
const FileText = FiFileText;

const Dashboard = ({ role, onNavigateToDocuments }) => {
  // Get user context
  const { user: currentUser } = useUser();
  
  // Determine user role and access level
  const roleLower = (role || currentUser?.role || '').toString().toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'administrator';
      const isDean = roleLower === 'dean';
      const isUser = roleLower === 'faculty';
      const effectiveIsDean = isDean || (currentUser?.role === 'DEAN' || currentUser?.role === 'dean');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('announcements');
  
  // Responsive detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [latestUsers, setLatestUsers] = useState([]);
  const [latestDocuments, setLatestDocuments] = useState([]);
  const [latestRequests, setLatestRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [docQuery, setDocQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [reqQuery, setReqQuery] = useState('');
  const [reqScope, setReqScope] = useState('assigned'); // 'assigned' | 'dept'

  // Define tabs based on user role
  const tabs = [
    { id: 'documents', label: 'Documents', icon: FiFileText },
    { id: 'requests', label: 'Requests', icon: FiClipboard },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'announcements', label: 'Announcements', icon: FiSpeaker },  ];


  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch latest users
        const usersResponse = await fetchWithRetry(buildUrl('users/latest?limit=10'), { credentials: 'include' });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          let filteredUsers = usersData.users || [];
          
          // Filter users by department for deans and users
          if ((effectiveIsDean || isUser) && currentUser?.department_id) {
            filteredUsers = filteredUsers.filter(user => {
              const userDept = user.department_id || user.department || user.department_name;
              const currentUserDept = currentUser.department_id || currentUser.department || currentUser.department_name;
              
              // Convert to strings for comparison
              const userDeptStr = userDept?.toString() || '';
              const currentUserDeptStr = currentUserDept?.toString() || '';
              
              return userDept == currentUserDept || 
                     userDeptStr === currentUserDeptStr ||
                     userDeptStr.toLowerCase() === currentUserDeptStr.toLowerCase();
            });
          }
          
          setLatestUsers(filteredUsers.slice(0, 10));
        }

        // Fetch latest documents
        const docsResponse = await fetchWithRetry(buildUrl('documents/latest?limit=10'), { credentials: 'include' });
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          const filteredDocs = docsData.documents || [];
          setLatestDocuments(filteredDocs.slice(0, 10));
        }

        // Fetch latest requests (scope-aware for dean/faculty)
        const scopeParam = (effectiveIsDean || isUser) ? `?scope=${encodeURIComponent(reqScope)}` : '';
        const requestsResponse = await fetchWithRetry(buildUrl(`documents/requests${scopeParam}`), { credentials: 'include' });
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          const filteredRequests = requestsData.documents || [];
          setLatestRequests(filteredRequests.slice(0, 10));
        }

        // Fetch notifications with proper visibility filtering
        const notifResponse = await fetchWithRetry(buildUrl('notifications'), { credentials: 'include' });
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          setNotifications(notifData.notifications || []);
        }

                // Fetch departments
        const deptResponse = await fetchWithRetry(buildUrl('departments'), { credentials: 'include' });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          const transformedDepartments = (deptData.departments || []).map(dept => ({
            department_id: parseInt(dept.value),
            name: dept.label,
            code: dept.code
          }));
          setDepartments(transformedDepartments);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, effectiveIsDean, isUser, reqScope]);





  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetchWithRetry(buildUrl(`notifications/${notificationId}/read`), {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update the notification in the local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        
        // Refresh unread count
        fetchUnreadNotificationCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  // Helper function to get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Robust visibility checker: considers multiple backend representations
  const isVisibleToAll = (obj = {}) => {
    const vals = [
      obj.visible_to_all,
      obj.visibility,
      obj.is_public,
      obj.public,
      obj.visibility_flag,
    ];
    for (const v of vals) {
      if (v === true || v === 1) return true;
      if (typeof v === 'number') {
        if (v === 1) return true;
      }
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes') return true;
        if (s === 'all' || s === 'public' || s === 'everyone') return true;
      }
    }
    return false;
  };

  // Truncate text to a maximum number of characters
  const truncate = (text, maxChars = 20) => {
    if (!text) return '';
    const t = text.toString();
    return t.length > maxChars ? `${t.slice(0, maxChars)}...` : t;
  };

  // Safely format date/time values coming in various shapes
  const formatDateTimeDisplay = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') {
      const s = value.trim();
      const ymdHms = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2})$/;
      if (ymdHms.test(s)) {
        const isoLike = s.replace(' ', 'T');
        const dt = new Date(isoLike);
        if (!isNaN(dt)) return `${dt.toLocaleDateString()} at ${dt.toLocaleTimeString()}`;
      }
      const ymdOnly = /^(\d{4}-\d{2}-\d{2})$/;
      if (ymdOnly.test(s)) {
        const dt = new Date(`${s}T00:00:00`);
        if (!isNaN(dt)) return `${dt.toLocaleDateString()} at ${dt.toLocaleTimeString()}`;
      }
      const fallback = new Date(s);
      if (!isNaN(fallback)) return `${fallback.toLocaleDateString()} at ${fallback.toLocaleTimeString()}`;
      return s;
    }
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`;
  };

  const pickCreatedDate = (obj) => {
    if (!obj) return null;
    const candidates = [obj.date_received, obj.created_at, obj.createdAt, obj.dateCreated, obj.created_date];
    return candidates.find(Boolean) || null;
  };

  const getActionDisplay = (obj) => {
    if (!obj) return '—';
    if (Array.isArray(obj.action_required) && obj.action_required.length > 0) {
      return obj.action_required.join(', ');
    }
    return obj.action_status || obj.status || '—';
  };

  // Handle document click to open document modal
  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
  };

  // Handle user click to navigate to users view
  const handleUserClick = (user) => {
    if (onNavigateToDocuments) {
      onNavigateToDocuments('admin-user');
    }
  };

  // Handle hover effects
  const handleMouseEnter = (event) => {
    event.target.style.backgroundColor = '#f1f5f9';
    event.target.style.borderColor = '#e2e8f0';
    event.target.style.transform = 'translateY(-1px)';
    event.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  };

  const handleMouseLeave = (event) => {
    event.target.style.backgroundColor = '#f8fafc';
    event.target.style.borderColor = 'transparent';
    event.target.style.transform = 'translateY(0)';
    event.target.style.boxShadow = 'none';
  };

  // Tab Components
  const OverviewTab = () => (
    <div style={styles.tabContent} className="dashboard-tab-content">
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Dashboard Overview</h2>
      </div>

      <div style={styles.statsGrid} className="dashboard-stats-grid">
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiFileText size={24} color="#10b981" />
            </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{latestDocuments.length}</div>
            <div style={styles.statTitle}>Recent Documents</div>
                        </div>
                      </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiUsers size={24} color="#3b82f6" />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{latestUsers.length}</div>
            <div style={styles.statTitle}>Recent Users</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiClipboard size={24} color="#f59e0b" />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{latestRequests.length}</div>
            <div style={styles.statTitle}>Recent Requests</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FiBell size={24} color="#ef4444" />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{notifications.length}</div>
            <div style={styles.statTitle}>Notifications</div>
          </div>
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => {
    const list = (latestDocuments || []).filter(d => {
      if (!docQuery) return true;
      const q = docQuery.toLowerCase();
      return (
        (d.title || '').toLowerCase().includes(q) ||
        (d.doc_type || '').toLowerCase().includes(q) ||
        (d.reference || '').toLowerCase().includes(q)
      );
    });
    return (
      <div style={styles.tabContent} className="dashboard-tab-content">
        <div style={styles.sectionHeader} className="dashboard-section-header">
          <h2 style={styles.sectionTitle}>Recent Documents</h2>
          <div className="dashboard-section-actions d-flex align-items-center flex-wrap">
            <button 
              style={{
                ...styles.secondaryBtn,
                borderRadius: '999px',
                padding: '8px 16px'
              }}
              onClick={() => onNavigateToDocuments('documents')}
            >
              <FiEye size={16} />
              View All
            </button>
            <button 
              style={{
                ...styles.primaryBtn,
                borderRadius: '999px',
                padding: '8px 16px'
              }}
              onClick={() => onNavigateToDocuments('upload')}
            >
              <FiPlus size={16} />
              Upload New
            </button>
          </div>
        </div>
        {loading ? (
          <div style={styles.loading}>Loading documents...</div>
        ) : list.length > 0 ? (
          <Row className="g-3">
            {list.map((doc) => (
              <Col key={doc.id} xs={12} md={6} lg={4} xl={3}>
                <Card className="h-100 recent-card" onClick={() => handleDocumentClick(doc)} style={{ cursor: 'pointer' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="light" text="dark" style={{ border: '1px solid #e2e8f0' }}>{doc.doc_type || 'Document'}</Badge>
                      <span className="text-muted" style={{ fontSize: 12 }}>{formatTimeAgo(doc.created_at)}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2" style={{ gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: '#374151' }}>
                        {doc.created_by_profile_pic ? (
                          <img src={doc.created_by_profile_pic} alt={doc.created_by_name || 'Creator'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{getInitials(doc.created_by_name)}</span>
                        )}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{truncate(doc.created_by_name || 'Unknown', 18)}</div>
                      </div>
                    </div>
                    <Card.Title style={{ fontSize: 'clamp(14px,2.4vw,16px)' }} className="mb-1">
                      {truncate(doc.title, 20)}
                    </Card.Title>
                    <Card.Text className="text-muted" style={{ fontSize: 13 }}>{doc.reference}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={styles.emptyState}>No documents found</div>
        )}
      </div>
    );
  };

  const UsersTab = () => {
    const list = (latestUsers || []).filter(u => {
      if (!userQuery) return true;
      const q = userQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.department_name || '').toLowerCase().includes(q)
      );
    });
    return (
      <div style={styles.tabContent} className="dashboard-tab-content">
        <div style={styles.sectionHeader} className="dashboard-section-header">
          <h2 style={styles.sectionTitle}>Recent Users</h2>
          <div className="dashboard-section-actions d-flex align-items-center flex-wrap">
            <button 
              style={{
                ...styles.secondaryBtn,
                borderRadius: '999px',
                padding: '8px 16px'
              }}
              onClick={() => onNavigateToDocuments('admin-user')}
            >
              <FiEye size={16} />
              View All
            </button>
          </div>
        </div>
        {loading ? (
          <div style={styles.loading}>Loading users...</div>
        ) : list.length > 0 ? (
          <Row className="g-3">
            {list.map((user) => (
              <Col key={user.id} xs={12} md={6} lg={4} xl={3}>
                <Card className="h-100 recent-card" onClick={() => handleUserClick(user)} style={{ cursor: 'pointer' }}>
                  <Card.Body className="d-flex align-items-center">
                    <div style={{ marginRight: 12 }}>
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div style={{ fontWeight: 600, fontSize: 'clamp(14px,2.4vw,16px)' }}>{truncate(user.name, 20)}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {user.role} • {user.department_name || 'No Department'}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={styles.emptyState}>No users found</div>
        )}
      </div>
    );
  };

  const RequestsTab = () => {
    const list = (latestRequests || []).filter(r => {
      if (!reqQuery) return true;
      const q = reqQuery.toLowerCase();
      return (
        (r.title || '').toLowerCase().includes(q) ||
        (r.doc_type || '').toLowerCase().includes(q) ||
        (r.reference || '').toLowerCase().includes(q) ||
        (r.action_status || '').toLowerCase().includes(q)
      );
    });
    return (
      <div style={styles.tabContent} className="dashboard-tab-content">
        <div style={styles.sectionHeader} className="dashboard-section-header">
          <h2 style={styles.sectionTitle}>Recent Requests</h2>
          <div className="dashboard-section-actions d-flex align-items-center flex-wrap">
            {(effectiveIsDean || isUser) && (
              <div className="btn-group me-2" role="group" aria-label="Requests scope">
                <button
                  className={`btn ${reqScope === 'assigned' ? 'btn-dark' : 'btn-light'} border rounded-pill px-3`}
                  onClick={() => setReqScope('assigned')}
                  title="Only requests assigned to you/your role/department"
                  style={{ marginRight: 6 }}
                >
                  Assigned
                </button>
                <button
                  className={`btn ${reqScope === 'dept' ? 'btn-dark' : 'btn-light'} border rounded-pill px-3`}
                  onClick={() => setReqScope('dept')}
                  title="Department overview (dept/role/public/in-department)"
                >
                  Dept Overview
                </button>
              </div>
            )}
            <button 
              style={{
                ...styles.secondaryBtn,
                borderRadius: '999px',
                padding: '8px 16px'
              }}
              onClick={() => onNavigateToDocuments('requests')}
            >
              <FiEye size={16} />
              View All
            </button>
          </div>
        </div>
        {loading ? (
          <div style={styles.loading}>Loading requests...</div>
        ) : list.length > 0 ? (
          <Row className="g-3">
            {list.map((request) => (
              <Col key={request.id} xs={12} md={6} lg={4} xl={3}>
                <Card className="h-100 recent-card" onClick={() => handleDocumentClick(request)} style={{ cursor: 'pointer' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="light" text="dark" style={{ border: '1px solid #e2e8f0' }}>{request.doc_type || 'Request'}</Badge>
                      <span className="text-muted" style={{ fontSize: 12 }}>{formatTimeAgo(request.date_received || request.created_at)}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2" style={{ gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: '#374151' }}>
                        {request.created_by_profile_pic ? (
                          <img src={request.created_by_profile_pic} alt={request.created_by_name || 'Creator'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{getInitials(request.created_by_name)}</span>
                        )}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{truncate(request.created_by_name || 'Unknown', 18)}</div>
                      </div>
                    </div>
                    <Card.Title style={{ fontSize: 'clamp(14px,2.4vw,16px)' }} className="mb-1">
                      {truncate(request.title, 20)}
                    </Card.Title>
                    <Card.Text className="text-muted" style={{ fontSize: 13 }}>{request.reference}</Card.Text>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {request.action_required && request.action_required.length > 0 && (
                        <Badge bg="danger" text="light">Action: {request.action_required.join(', ')}</Badge>
                      )}
                      {request.action_status && (
                        <Badge bg={request.action_status === 'completed' ? 'success' : 'warning'} text={request.action_status === 'completed' ? 'light' : 'dark'}>
                          {request.action_status}
                        </Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={styles.emptyState}>No requests found</div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents': return <DocumentsTab />;
      case 'requests': return <RequestsTab />;
      case 'users': return <UsersTab />;
      case 'announcements': return <Announcements role={role} setActiveTab={setActiveTab} />;
      default: return <DocumentsTab />;
    }
  };



  return (
    <div style={styles.container} className="dashboard-root">
      <Row className="align-items-start mb-3">
        <Col>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back! Here's what's happening today.</p>
        </Col>
      </Row>

      {isMobile ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  background: activeTab === tab.id ? '#111' : 'white',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : (
        <Nav variant="tabs" activeKey={activeTab} className="mb-0 dashboard-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Nav.Item key={tab.id}>
                <Nav.Link eventKey={tab.id} onClick={() => setActiveTab(tab.id)}>
                  <Icon size={18} style={{ marginRight: 8 }} />{tab.label}
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      )}

      <div style={styles.content} className="dashboard-content">
        {renderTabContent()}
      </div>

       {/* Document Modal */}
       {showDocumentModal && selectedDocument && (
         <div style={styles.modalOverlay}>
           <div style={styles.modal}>
             <div style={styles.modalHeader}>
               <div style={styles.modalTitleSection}>
                 <FileText style={styles.modalIcon} />
                 <h3 style={styles.modalTitle}>Document Details</h3>
               </div>
             </div>
             <div style={styles.modalBody}>
               <div style={styles.documentModalContent}>
                 <div style={styles.documentModalSection}>
                   <h4 style={styles.documentModalSectionTitle}>Document Information</h4>
                   <div style={styles.documentModalInfo}>
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Title:</span>
                       <span style={styles.documentModalValue}>{selectedDocument.title}</span>
                     </div>
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Type:</span>
                       <span style={styles.documentModalValue}>{selectedDocument.doc_type}</span>
                     </div>
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Reference:</span>
                       <span style={styles.documentModalValue}>{selectedDocument.reference}</span>
                     </div>
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Status:</span>
                       <span style={styles.documentModalValue}>{selectedDocument.status}</span>
                     </div>
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Created:</span>
                       <span style={styles.documentModalValue}>
                         {formatDateTimeDisplay(pickCreatedDate(selectedDocument))}
                       </span>
                     </div>
                     {selectedDocument.updated_at && (
                       <div style={styles.documentModalField}>
                         <span style={styles.documentModalLabel}>Last Updated:</span>
                         <span style={styles.documentModalValue}>
                           {new Date(selectedDocument.updated_at).toLocaleDateString()} at {new Date(selectedDocument.updated_at).toLocaleTimeString()}
                         </span>
                       </div>
                     )}
                     <div style={styles.documentModalField}>
                       <span style={styles.documentModalLabel}>Action:</span>
                       <span style={styles.documentModalValue}>{getActionDisplay(selectedDocument)}</span>
                     </div>
                   </div>
                 </div>
                 
                 {selectedDocument.description && (
                   <div style={styles.documentModalSection}>
                     <h4 style={styles.documentModalSectionTitle}>Description</h4>
                     <p style={styles.documentModalDescription}>{selectedDocument.description}</p>
                   </div>
                 )}
                 
                 {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                   <div style={styles.documentModalSection}>
                     <h4 style={styles.documentModalSectionTitle}>Tags</h4>
                     <div style={styles.documentModalTags}>
                       {selectedDocument.tags.map((tag, index) => (
                         <span key={index} style={styles.documentModalTag}>{tag}</span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             </div>
             <div style={styles.modalFooter}>
               <button 
                 onClick={() => {
                   setShowDocumentModal(false);
                   setSelectedDocument(null);
                 }}
                 style={styles.submitBtn}
                 onMouseEnter={(e) => {
                   Object.assign(e.target.style, styles.submitBtnHover);
                 }}
                 onMouseLeave={(e) => {
                   Object.assign(e.target.style, styles.submitBtn);
                 }}
               >
                 Close
               </button>
               <button 
                 onClick={() => {
                   if (onNavigateToDocuments) {
                     onNavigateToDocuments('requests');
                   }
                 }}
                 style={styles.primaryBtn}
                 onMouseEnter={(e) => {
                   Object.assign(e.target.style, styles.primaryBtnHover);
                 }}
                 onMouseLeave={(e) => {
                   Object.assign(e.target.style, styles.submitBtn);
                 }}
               >
                 View Full Request
               </button>
             </div>
           </div>
         </div>
       )}

    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: 'clamp(20px, 3.5vw, 28px)',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: 'clamp(12px, 2.2vw, 16px)',
    color: '#64748b',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
  },
  activeTab: {
    background: '#111',
    color: 'white',
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    minHeight: '600px',
    overflow: 'visible',
  },
  tabContent: {
    padding: 'clamp(16px, 3vw, 32px)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  notificationBtnHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    color: '#475569',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px solid #000000',
    backgroundColor: 'transparent',
    color: '#000000',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  primaryBtnHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#475569',
    color: '#475569',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 24px)',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'clamp(16px, 2.5vw, 18px)',
    color: '#1e293b',
    margin: 0,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
  },
  sectionBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#64748b',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sectionBtnHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    color: '#475569',
  },

  documentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  documentIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e0e7ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
  },
  documentInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  documentTitle: {
    margin: '0 0 5px 0',
    fontSize: 'clamp(14px, 2.4vw, 16px)',
    color: '#333',
    fontWeight: '500',
  },
  documentDetails: {
    fontSize: 'clamp(11px, 2vw, 12px)',
    color: '#666',
  },
  documentItemHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  documentAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: '#888',
    fontStyle: 'italic',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e0e7ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '15px',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarInitials: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    margin: '0 0 5px 0',
    fontSize: 'clamp(14px, 2.4vw, 16px)',
    color: '#333',
    fontWeight: '600',
  },
  userDetails: {
    fontSize: 'clamp(12px, 2vw, 13px)',
    color: '#666',
  },
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 3001,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitleSection: {
    display: 'flex',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: '8px',
    color: '#6366f1',
  },
  modalTitle: {
    margin: '0',
    fontSize: 'clamp(18px, 3vw, 20px)',
    color: '#333',
  },
  closeBtn: {
    backgroundColor: '#e2e8f0',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  closeBtnHover: {
    backgroundColor: '#cbd5e1',
    color: '#475569',
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 'clamp(12px, 2.2vw, 14px)',
    color: '#555',
    marginBottom: '8px',
    fontWeight: '500',
  },
  input: {
    padding: '10px 15px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#333',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    padding: '10px 15px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#333',
    resize: 'vertical',
    minHeight: '80px',
    transition: 'border-color 0.2s ease',
  },
  visibilitySection: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  pillBtn: {
    flex: 1,
    padding: '8px 15px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  pillBtnHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  pillBtnActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    color: '#6366f1',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#555',
    marginBottom: '10px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginRight: '8px',
    accentColor: '#4f46e5',
  },
  departmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  departmentItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
  },
  departmentName: {
    marginLeft: '4px',
  },
  departmentPillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  departmentPill: {
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  departmentPillHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  departmentPillActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    color: '#6366f1',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '15px 20px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '8px 15px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
  },
  cancelBtnHover: {
    backgroundColor: '#cbd5e1',
    color: '#374151',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    padding: '8px 15px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  submitBtnHover: {
    backgroundColor: '#4338ca',
  },
  spinner: {
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #4f46e5',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    animation: 'spin 1s linear infinite',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  announcementItem: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  announcementTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 12px 0',
    lineHeight: '1.4',
  },
  announcementActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionBtn: {
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  actionBtnHover: {
    backgroundColor: '#c7d2fe',
  },
  announcementBody: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
  },
  activityIcon: {
    marginRight: '12px',
    color: '#6366f1',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#1e293b',
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
  },

  // Document Modal Styles
  documentModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  documentModalSection: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '20px',
  },
  documentModalSectionTitle: {
    fontSize: 'clamp(15px, 2.6vw, 16px)',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px 0',
  },
  documentModalInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  documentModalField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 0',
  },
  documentModalLabel: {
    fontSize: 'clamp(12px, 2.2vw, 14px)',
    fontWeight: '500',
    color: '#64748b',
    minWidth: '120px',
  },
  documentModalValue: {
    fontSize: 'clamp(12px, 2.2vw, 14px)',
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: '16px',
  },
  documentModalDescription: {
    fontSize: 'clamp(13px, 2.2vw, 14px)',
    color: '#374151',
    lineHeight: '1.6',
    margin: 0,
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  documentModalTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  documentModalTag: {
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
  },

  // Simplified List Styles
  simpleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9',
  },
  simpleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  simpleItemContent: {
    flex: 1,
    minWidth: 0,
  },
  simpleItemTitle: {
    fontSize: 'clamp(13px, 2.2vw, 14px)',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  },
  simpleItemText: {
    fontSize: 'clamp(12px, 2vw, 13px)',
    color: '#64748b',
    margin: '0 0 6px 0',
    lineHeight: '1.4',
  },
  simpleItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'clamp(11px, 1.8vw, 12px)',
    color: '#94a3b8',
  },
  simpleItemDate: {
    fontWeight: '500',
  },
  simpleItemAuthor: {
    fontWeight: '500',
  },
  simpleItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
    flexShrink: 0,
  },
  simpleItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  simpleActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  simpleActionBtnHover: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  scrollIndicator: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    marginTop: '8px',
  },
  scrollText: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },

  // Additional tab-based styles
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#666',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'white',
    color: '#666',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'clamp(12px, 3vw, 20px)',
    marginBottom: '24px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: 'clamp(14px, 3vw, 20px)',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: 'none',
  },
  statIcon: {
    width: 'clamp(36px, 6vw, 48px)',
    height: 'clamp(36px, 6vw, 48px)',
    borderRadius: '12px',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 'clamp(18px, 3.2vw, 24px)',
    fontWeight: '700',
    color: '#111',
    marginBottom: '4px',
  },
  statTitle: {
    fontSize: 'clamp(12px, 2.2vw, 14px)',
    color: '#666',
    marginBottom: '4px',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  overviewCard: {
    padding: '24px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
  },
  cardTitle: {
    fontSize: 'clamp(16px, 2.6vw, 18px)',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 16px 0',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  healthStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  healthItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'clamp(12px, 2.2vw, 14px)',
    color: '#111',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#666',
    textAlign: 'center',
  },
  selectContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  select: {
    padding: '8px 32px 8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    appearance: 'none',
    minWidth: '150px',
  },

  // New announcement styles
  announcementContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  announcementCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
  },
  announcementAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  authorAvatar: {
    position: 'relative',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  authorName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  announcementDate: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  deleteBtn: {
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  announcementContent: {
    marginBottom: '16px',
  },
  announcementFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  visibilityBadge: {
    display: 'flex',
    gap: '8px',
  },
  globalBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  targetedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionRequired: {
    fontSize: '12px',
    color: '#dc2626',
    fontWeight: '500',
    backgroundColor: '#fef2f2',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  publishedBadge: {
    padding: '4px 8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  draftBadge: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

};

export default Dashboard;  
