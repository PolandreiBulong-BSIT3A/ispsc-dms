import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { FiBarChart, FiTrendingUp, FiActivity, FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi';
import Sidebar from './sidebar.jsx';
import Navbar from './navbar.jsx';
import Dashboard from '../../components/Dashboard.jsx';
import User from '../../components/User.jsx';
import Upload from '../../components/Upload.jsx';
import Update from '../../components/Update.jsx';
import Reply from '../../components/Reply.jsx';
import Document from '../../components/Document.jsx';
import DocumentTrashcan from '../../components/DocumentTrashcan.jsx';
import UserTrash from '../../components/UserTrash.jsx';
import { Profile } from '../../components/Profile.jsx';
import Report from '../../components/Report.jsx';
import Request from '../../components/Request.jsx';
import { Favorite } from '../../components/Favorite.jsx';
import AdminPanel from '../../components/AdminPanel.jsx';
import { useUser } from '../../../contexts/UserContext';
import { useLocation } from 'react-router-dom';
import BackgroundImage from '../../../assets/backgrounds/bg_main.png';
import './structure.css';

const Structure = ({ role }) => {
  const { user } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [updateDocId, setUpdateDocId] = useState(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Setup responsive detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  // Check if user needs to complete profile
  useEffect(() => {
    console.log('Checking profile completion for user:', user);
    
    if (!user) {
      console.log('No user data - hiding banner');
      setShowProfileBanner(false);
      return;
    }
    
    // Check if profile is complete
    const hasDepartment = user.department_id && user.department_id.toString().trim() !== '';
    const hasContactNumber = user.contactNumber && user.contactNumber.toString().trim() !== '';
    
    console.log('Profile completion check:');
    console.log('- department_id:', user.department_id, 'Has department:', hasDepartment);
    console.log('- contactNumber:', user.contactNumber, 'Has contact number:', hasContactNumber);
    
    if (!hasDepartment || !hasContactNumber) {
      console.log('Profile incomplete - showing banner');
      setShowProfileBanner(true);
    } else {
      console.log('Profile complete - hiding banner');
      setShowProfileBanner(false);
    }
  }, [user]);

  useEffect(() => {
    const openTrash = () => setActiveTab('user-trash');
    window.addEventListener('open-user-trash', openTrash);
    return () => window.removeEventListener('open-user-trash', openTrash);
  }, []);

  // Detect route changes and set activeTab accordingly
  useEffect(() => {
    if (location.pathname === '/requests') {
      setActiveTab('requests');
    }
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      {/* Background Image with Semi-transparent Overlay */}
      <div 
        className="background-overlay"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
        }}
      />
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        isMobile={isMobile}
      />

      {/* Navbar */}
      <Navbar sidebarOpen={sidebarOpen} role={user?.role || role} setRole={undefined} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />

      {/* Mobile backdrop for sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toggle button positioned responsively */}
      {!isMobile && (
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`sidebar-toggle-btn ${isMobile ? 'mobile' : ''}`}
        style={{
          left: sidebarOpen ? '250px' : '70px'
        }}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
      </button>
      )}

      {/* Main Content */}
      <Container fluid className="main-content" style={{
        marginLeft: isMobile ? 0 : (sidebarOpen ? '250px' : '70px'),
      }}>
        
        {/* Profile Completion Banner */}
        {showProfileBanner && (
          <Alert variant="warning" className="profile-banner mb-4">
            <Row className="align-items-center w-100">
              <Col xs={12} md={8}>
                <div className="d-flex align-items-center">
                  <div className="profile-banner-icon me-3">
                    ⚠️
                  </div>
                  <div className="profile-banner-content">
                    <h6 className="mb-1">Complete Your Profile</h6>
                    <p className="mb-0">
                      Please complete your profile information (department and contact number) to access all features.
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={4}>
                <div className="profile-banner-actions">
                  <Button
                    variant="warning"
                    size="sm"
                    className="profile-banner-btn"
                    onClick={() => {
                      // Navigate to profile page
                      setActiveTab('profile');
                    }}
                  >
                    Complete Now
                  </Button>
                  <button
                    className="profile-banner-close"
                    onClick={() => setShowProfileBanner(false)}
                    title="Dismiss"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </Col>
            </Row>
          </Alert>
        )}

        {/* Content Area */}
        <Row>
          <Col xs={12}>
            {activeTab === 'dashboard' ? (
              <Dashboard role={role} onNavigateToDocuments={setActiveTab} />
            ) : activeTab === 'user' ? (
              <User role={role} />
            ) : activeTab === 'department-users' ? (
              <User role={role} />
            ) : activeTab === 'admin-user' ? (
              <User role={role} />
            ) : activeTab === 'upload' ? (
              <Upload role={role} onNavigateToDocuments={setActiveTab} />
            ) : activeTab === 'reply' ? (
              <Reply onNavigateToDocuments={setActiveTab} />
            ) : activeTab === 'documents' ? (
              <Document 
                role={user?.role || role} 
                onOpenTrash={() => setActiveTab('trash')} 
                onNavigateToUpload={setActiveTab}
                onNavigateToDocuments={setActiveTab}
                onNavigateToUpdate={(id) => { setUpdateDocId(id); setActiveTab('update'); }}
              />
            ) : activeTab === 'update' ? (
              <Update 
                role={user?.role || role}
                id={updateDocId}
                onNavigateToDocuments={setActiveTab}
              />
            ) : activeTab === 'favorites' ? (
              <Favorite 
                role={user?.role || role} 
                onNavigateToDocuments={setActiveTab}
              />
            ) : activeTab === 'trash' ? (
              <DocumentTrashcan onBack={() => setActiveTab('documents')} />
            ) : activeTab === 'user-trash' ? (
              <UserTrash onBack={() => setActiveTab('admin-user')} />
            ) : activeTab === 'reports' ? (
              <Report />
            ) : activeTab === 'profile' ? (
              <Profile />
            ) : activeTab === 'requests' ? (
              <Request onNavigateToUpload={setActiveTab} />
            ) : activeTab === 'admin' ? (
              <AdminPanel role={role} />
            ) : (
              <div className="placeholder-content">
                <div className="placeholder-inner">
                  <FiBarChart className="placeholder-icon" />
                  <h3 className="placeholder-title">Content Coming Soon</h3>
                  <p className="placeholder-text">
                    This section is under development.
                  </p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Structure;