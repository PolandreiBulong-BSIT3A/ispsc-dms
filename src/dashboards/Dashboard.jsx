import React from 'react';
import { useUser } from '../contexts/UserContext';
import Structure from './main/layout/structure.jsx';

const Dashboard = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Structure role={user?.role} />
  );
};

export default Dashboard;
