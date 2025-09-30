import React from 'react';

const Report = () => {
  const openStreamlitApp = () => {
    window.open('https://dmsispsc-kcaufdztukransoxf6vxky.streamlit.app', '_blank');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics & Reports</h1>
          <p style={styles.subtitle}>Comprehensive system insights and performance metrics via Streamlit</p>
        </div>
        <button onClick={openStreamlitApp} style={styles.pillButton}>
          Open in New Tab
        </button>
      </div>
      
      <div style={styles.iframeContainer}>
        <iframe
          src="https://dmsispsc-kcaufdztukransoxf6vxky.streamlit.app"
          title="DMS Analytics Dashboard"
          style={styles.iframe}
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  pillButton: {
    padding: '12px 24px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
  },
  iframeContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    height: 'calc(100vh - 200px)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
  },
};

export default Report;
