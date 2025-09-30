import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './login_system/login.jsx'
import Dashboard from './dashboards/Dashboard.jsx'
import Request from './dashboards/components/Request.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MaintenanceNotification from './components/MaintenanceNotification.jsx'
import { DocumentProvider } from './contexts/DocumentContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import './App.css'

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showMaintenanceNotification, setShowMaintenanceNotification] = useState(false);
  const [previousMaintenanceState, setPreviousMaintenanceState] = useState(false);

  // Check maintenance mode and user role on app load
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          const newMaintenanceMode = data.maintenanceMode || false;
          console.log('Debug - Maintenance status response:', data);
          
          // Check if maintenance mode was just enabled
          if (newMaintenanceMode && !previousMaintenanceState && userRole) {
            setShowMaintenanceNotification(true);
          }
          
          setMaintenanceMode(newMaintenanceMode);
          setPreviousMaintenanceState(newMaintenanceMode);
        } else {
          console.error('Failed to fetch maintenance status');
          setMaintenanceMode(false);
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
        setMaintenanceMode(false);
      }
    };

    const checkUserRole = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        } else if (response.status === 401) {
          // User is not authenticated - this is expected and normal
          setUserRole(null);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        // Suppress network errors for auth check as they're expected when not logged in
        setUserRole(null);
      }
    };

    const initializeApp = async () => {
      await Promise.all([checkMaintenanceStatus(), checkUserRole()]);
      setLoading(false);
    };

    initializeApp();

    // Check maintenance status every 60 seconds to avoid rate limits
    const interval = setInterval(() => {
      checkMaintenanceStatus();
      // Also recheck user role in case session expired
      checkUserRole();
    }, 60000);

    // Refresh when tab becomes active again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMaintenanceStatus();
        checkUserRole();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Show loading while checking maintenance status
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Debug logging
  console.log('Debug - maintenanceMode:', maintenanceMode);
  console.log('Debug - userRole:', userRole);
  console.log('Debug - loading:', loading);

  // Maintenance mode UX now handled inside Login.jsx; do not redirect to a separate page

  return (
    <UserProvider>
      <DocumentProvider>
        <NotificationProvider>
          <div className="App">
            {/* Show maintenance notification when maintenance mode is enabled while user is logged in */}
            {showMaintenanceNotification && (
              <MaintenanceNotification
                isAdmin={userRole && userRole.toLowerCase() === 'admin'}
                onDismiss={() => setShowMaintenanceNotification(false)}
              />
            )}
            
            <Routes>
              {/* Default route redirects to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Login route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Dashboard route */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Requests - documents requiring action */}
              <Route 
                path="/requests" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin-only routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <div>Admin Dashboard (Coming Soon)</div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Dean routes */}
              <Route 
                path="/dean" 
                element={
                  <ProtectedRoute requiredRole="dean">
                    <div>Dean Dashboard (Coming Soon)</div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </NotificationProvider>
      </DocumentProvider>
    </UserProvider>
  )
}

export default App
