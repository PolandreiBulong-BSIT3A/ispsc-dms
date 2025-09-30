import React, { useState, useEffect } from 'react';
import { fetchWithRetry } from '../../lib/api/frontend/http.js';
import { 
  FiUsers, 
  FiSettings, 
  FiBarChart, 
  FiShield, 
  FiDatabase, 
  FiActivity,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiChevronDown
} from 'react-icons/fi';

const AdminPanel = ({ role }) => {
  // Check if user has access to admin panel
  if (role === 'faculty') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Access Denied</h1>
          <p style={styles.subtitle}>You don't have permission to access the admin panel.</p>
        </div>
        <div style={styles.placeholder}>
          <FiShield size={48} color="#ccc" />
          <p>Only administrators and deans can access the admin panel.</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  
  // Document Types state
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docTypeForm, setDocTypeForm] = useState({ type_name: '' });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [rowDocuments, setRowDocuments] = useState({});
  
  // Folders state
  const [folders, setFolders] = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({ name: '' });
  
  // Departments state
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  // Actions state
  const [actions, setActions] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [actionForm, setActionForm] = useState({ 
    action_name: '', 
    action_description: '', 
    action_category: 'custom', 
    is_active: 1 
  });

  // System maintenance state
  const [systemHealth, setSystemHealth] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceStartTime, setMaintenanceStartTime] = useState(''); // datetime-local value
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(''); // datetime-local value
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [systemStats, setSystemStats] = useState({});
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);

  // Fetch functions
  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/departments', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/actions', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  // Helpers
  const toDatetimeLocal = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatReadable = (isoOrLocal) => {
    if (!isoOrLocal) return null;
    const d = new Date(isoOrLocal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
    const startTxt = formatReadable(maintenanceStartTime);
    const endTxt = formatReadable(maintenanceEndTime);
    if (startTxt && endTxt) setPreviewText(`Will be active from ${startTxt} to ${endTxt}.`);
    else if (endTxt) setPreviewText(`Will end at ${endTxt}.`);
    else if (startTxt) setPreviewText(`Will start at ${startTxt}.`);
    else setPreviewText('');
  }, [maintenanceStartTime, maintenanceEndTime]);

  const fetchDocumentTypes = async () => {
    setLoadingDocTypes(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/document-types', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoadingDocTypes(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/folders', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // System maintenance functions
  const fetchSystemHealth = async () => {
    setLoadingHealth(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/system/health', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.health || {});
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/logs?limit=50', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchBackupHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/backups', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setBackupHistory(data.backups || []);
      }
    } catch (error) {
      console.error('Error fetching backup history:', error);
    }
  };

  const fetchMaintenanceMode = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/maintenance', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode || false);
      }
    } catch (error) {
      console.error('Error fetching maintenance mode:', error);
    }
  };

  const fetchMaintenanceSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maintenance/status');
      if (response.ok) {
        const data = await response.json();
        const msg = data.maintenanceMessage || '';
        const startIso = data.maintenanceStartTime || '';
        const endIso = data.maintenanceEndTime || '';
        // Convert ISO to datetime-local format (YYYY-MM-DDTHH:MM)
        let endLocal = '';
        let startLocal = '';
        if (startIso) {
          const d = new Date(startIso);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            startLocal = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        }
        if (endIso) {
          const d = new Date(endIso);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            endLocal = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        }
        setMaintenanceMessage(msg);
        setMaintenanceStartTime(startLocal);
        setMaintenanceEndTime(endLocal);
      }
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/stats', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/cache/clear', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        alert('Cache cleared successfully!');
      } else {
        alert('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    }
  };

  const handleCreateBackup = async () => {
    setLoadingBackup(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/system/backup', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Backup initiated: ${data.backupName}`);
        await fetchBackupHistory();
      } else {
        alert('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleToggleMaintenanceMode = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          enabled: !maintenanceMode,
          maintenanceMessage,
          maintenanceStartTime: maintenanceStartTime ? new Date(maintenanceStartTime).toISOString() : null,
          maintenanceEndTime: maintenanceEndTime ? new Date(maintenanceEndTime).toISOString() : null
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode);
        if (typeof data.maintenanceMessage === 'string') setMaintenanceMessage(data.maintenanceMessage);
        if (data.maintenanceEndTime) {
          // convert back to datetime-local
          const d = new Date(data.maintenanceEndTime);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            setMaintenanceEndTime(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
          }
        }
        alert(data.message);
      } else {
        alert('Failed to toggle maintenance mode');
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      alert('Failed to toggle maintenance mode');
    }
  };

  const handleSaveMaintenanceSettings = async () => {
    // Validate before submit
    const now = Date.now();
    let error = '';
    const toMs = (val) => (val ? new Date(val).getTime() : null);
    const startLocalMs = toMs(maintenanceStartTime);
    const endLocalMs = toMs(maintenanceEndTime);

    if (maintenanceStartTime && (!startLocalMs || isNaN(startLocalMs))) error = 'Invalid start time.';
    if (!error && maintenanceEndTime && (!endLocalMs || isNaN(endLocalMs))) error = 'Invalid end time.';
    if (!error && maintenanceStartTime && startLocalMs <= now) error = 'Start time must be in the future.';
    if (!error && maintenanceEndTime && endLocalMs <= now) error = 'End time must be in the future.';
    if (!error && maintenanceStartTime && maintenanceEndTime && endLocalMs <= startLocalMs) error = 'End time must be later than start time.';

    setValidationError(error);
    if (error) return;

    setSavingMaintenance(true);
    try {
      const response = await fetch('http://localhost:5000/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: maintenanceMode,
          maintenanceMessage,
          maintenanceStartTime: maintenanceStartTime ? new Date(maintenanceStartTime).toISOString() : null,
          maintenanceEndTime: maintenanceEndTime ? new Date(maintenanceEndTime).toISOString() : null
        })
      });
      if (response.ok) {
        const data = await response.json();
        alert('Maintenance settings saved');
      } else {
        const err = await response.json().catch(()=>({}));
        alert(err.message || 'Failed to save maintenance settings');
      }
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      alert('Failed to save maintenance settings');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Department CRUD handlers
  const handleAddDepartment = () => {
    setEditingDept(null);
    setDeptForm({ name: '', code: '' });
    setShowDeptModal(true);
  };

  const handleEditDepartment = (dept) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, code: dept.code });
    setShowDeptModal(true);
  };

  const handleSaveDepartment = async () => {
    try {
      const url = editingDept 
        ? `http://localhost:5000/api/departments/${editingDept.department_id}`
        : 'http://localhost:5000/api/departments';
      
      const response = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deptForm)
      });

      if (response.ok) {
        await fetchDepartments();
        setShowDeptModal(false);
        setDeptForm({ name: '', code: '' });
        setEditingDept(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save department');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${deptId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchDepartments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  // Action CRUD handlers
  const handleAddAction = () => {
    setEditingAction(null);
    setActionForm({ 
      action_name: '', 
      action_description: '', 
      action_category: 'custom', 
      is_active: 1 
    });
    setShowActionModal(true);
  };

  const handleEditAction = (action) => {
    setEditingAction(action);
    setActionForm({ 
      action_name: action.action_name, 
      action_description: action.action_description || '', 
      action_category: action.action_category, 
      is_active: action.is_active 
    });
    setShowActionModal(true);
  };

  const handleSaveAction = async () => {
    try {
      const url = editingAction 
        ? `http://localhost:5000/api/actions/${editingAction.action_id}`
        : 'http://localhost:5000/api/actions';
      
      const response = await fetch(url, {
        method: editingAction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(actionForm)
      });

      if (response.ok) {
        await fetchActions();
        setShowActionModal(false);
        setActionForm({ 
          action_name: '', 
          action_description: '', 
          action_category: 'custom', 
          is_active: 1 
        });
        setEditingAction(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save action');
      }
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Failed to save action');
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!confirm('Are you sure you want to delete this action?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/actions/${actionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchActions();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete action');
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('Failed to delete action');
    }
  };

  // Row expansion handlers
  const toggleRowExpansion = async (type, id) => {
    const key = `${type}_${id}`;
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(key);
      setExpandedRows(newExpanded);
      
      // Fetch documents if not already loaded
      if (!rowDocuments[key]) {
        let endpoint;
        switch (type) {
          case 'doctype':
            endpoint = `http://localhost:5000/api/document-types/${id}/documents`;
            break;
          case 'folder':
            endpoint = `http://localhost:5000/api/folders/${id}/documents`;
            break;
          case 'department':
            endpoint = `http://localhost:5000/api/departments/${id}/documents`;
            break;
          case 'department_users':
            endpoint = `http://localhost:5000/api/departments/${id}/users`;
            break;
          default:
            console.error(`Unknown type: ${type}`);
            return;
        }
        
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            setRowDocuments(prev => ({
              ...prev,
              [key]: data.documents || data.users || []
            }));
          }
        } catch (error) {
          console.error('Error fetching documents:', error);
        }
      }
    }
  };

  // Document Type CRUD handlers
  const handleAddDocumentType = () => {
    setEditingDocType(null);
    setDocTypeForm({ type_name: '' });
    setShowDocTypeModal(true);
  };

  const handleEditDocumentType = (docType) => {
    setEditingDocType(docType);
    setDocTypeForm({ type_name: docType.type_name });
    setShowDocTypeModal(true);
  };

  const handleSaveDocumentType = async () => {
    try {
      const url = editingDocType 
        ? `http://localhost:5000/api/document-types/${editingDocType.type_id}`
        : 'http://localhost:5000/api/document-types';
      
      const response = await fetch(url, {
        method: editingDocType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(docTypeForm)
      });

      if (response.ok) {
        await fetchDocumentTypes();
        setShowDocTypeModal(false);
        setDocTypeForm({ type_name: '', description: '' });
        setEditingDocType(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save document type');
      }
    } catch (error) {
      console.error('Error saving document type:', error);
      alert('Failed to save document type');
    }
  };

  const handleDeleteDocumentType = async (typeId) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/document-types/${typeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchDocumentTypes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete document type');
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      alert('Failed to delete document type');
    }
  };

  // Folder CRUD handlers
  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderForm({ name: '' });
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({ name: folder.name });
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    try {
      const url = editingFolder 
        ? `http://localhost:5000/api/folders/${editingFolder.folder_id}`
        : 'http://localhost:5000/api/folders';
      
      const response = await fetch(url, {
        method: editingFolder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(folderForm)
      });

      if (response.ok) {
        await fetchFolders();
        setShowFolderModal(false);
        setFolderForm({ name: '' });
        setEditingFolder(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save folder');
      }
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Failed to save folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/folders/${folderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchFolders();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchDocumentTypes();
    fetchFolders();
    fetchActions();
    
    // Role-based data fetching
    if (role === 'admin') {
      // Admins can see everything
      fetchDepartments();
      fetchSystemHealth();
      fetchSystemLogs();
      fetchBackupHistory();
      fetchMaintenanceMode();
      fetchMaintenanceSettings();
      fetchSystemStats();
    }
  }, [role]);

  // Set initial tab based on role
  useEffect(() => {
    const availableTabs = getTabsForRole(role);
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [role]);

  // Role-based tabs
  const getTabsForRole = (userRole) => {
    const allTabs = [
      { id: 'documents', label: 'Document Management', icon: FiFileText },
      { id: 'departments', label: 'Departments', icon: FiSettings },
      { id: 'actions', label: 'Actions', icon: FiActivity },
      { id: 'maintenance', label: 'Maintenance', icon: FiAlertTriangle },
      { id: 'system', label: 'System Settings', icon: FiShield }
    ];

    if (userRole === 'dean') {
      // Deans can only see documents and actions
      return allTabs.filter(tab => ['documents', 'actions'].includes(tab.id));
    } else if (userRole === 'admin') {
      // Admins can see all tabs
      return allTabs;
    }
    
    // Default fallback
    return allTabs;
  };

  const tabs = getTabsForRole(role);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        <Icon size={24} color={color} />
      </div>
      <div style={styles.statContent}>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
        {trend && (
          <div style={{ ...styles.statTrend, color: trend > 0 ? '#10b981' : '#ef4444' }}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );


  const UsersTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>User Management</h2>
        <button style={styles.primaryBtn}>
          <FiPlus size={16} />
          Add User
        </button>
      </div>
      <div style={styles.placeholder}>
        <FiUsers size={48} color="#ccc" />
        <p>User management interface will be implemented here</p>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div style={styles.tabContent}>
      {/* Document Types Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Document Types</h2>
          <button style={styles.primaryBtn} onClick={handleAddDocumentType}>
            <FiPlus size={16} />
            Add Document Type
          </button>
        </div>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Type Name</th>
                <th style={styles.th}>Documents</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentTypes.map(docType => {
                const rowKey = `doctype_${docType.type_id}`;
                const isExpanded = expandedRows.has(rowKey);
                const documents = rowDocuments[rowKey] || [];
                
                return (
                  <React.Fragment key={docType.type_id}>
                    <tr style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {docType.document_count > 0 && (
                            <button
                              onClick={() => toggleRowExpansion('doctype', docType.type_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title={isExpanded ? 'Hide documents' : 'Show documents'}
                            >
                              <FiChevronDown 
                                size={14} 
                                style={{ 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }} 
                              />
                            </button>
                          )}
                          <strong>{docType.type_name}</strong>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: docType.document_count > 0 ? '#dbeafe' : '#f3f4f6',
                          color: docType.document_count > 0 ? '#1e40af' : '#6b7280',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {docType.document_count || 0} docs
                        </span>
                      </td>
                      <td style={styles.td}>{docType.created_at ? new Date(docType.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={styles.editBtn} 
                            onClick={() => handleEditDocumentType(docType)}
                            title="Edit"
                            disabled={docType.type_id === 999}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button 
                            style={styles.deleteBtn} 
                            onClick={() => handleDeleteDocumentType(docType.type_id)}
                            title="Delete"
                            disabled={docType.type_id === 999}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="4" style={{ ...styles.td, padding: '0', backgroundColor: '#f8fafc' }}>
                          <div style={{ padding: '12px 16px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                              Documents using this type:
                            </h4>
                            {documents.length > 0 ? (
                              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {documents.map(doc => (
                                  <div key={doc.doc_id} style={{
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px'
                                  }}>
                                    <div style={{ fontWeight: '500', color: '#111827' }}>{doc.title}</div>
                                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                      {doc.reference} • {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading documents...</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {documentTypes.length === 0 && (
            <div style={styles.emptyState}>
              <FiFileText size={48} color="#ccc" />
              <p>{loadingDocTypes ? 'Loading document types...' : 'No document types found. Add your first document type to get started.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Folders Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Folders</h2>
          <button style={styles.primaryBtn} onClick={handleAddFolder}>
            <FiPlus size={16} />
            Add Folder
          </button>
        </div>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Folder Name</th>
                <th style={styles.th}>Documents</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Updated</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(folder => {
                const rowKey = `folder_${folder.folder_id}`;
                const isExpanded = expandedRows.has(rowKey);
                const documents = rowDocuments[rowKey] || [];
                
                return (
                  <React.Fragment key={folder.folder_id}>
                    <tr style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {folder.document_count > 0 && (
                            <button
                              onClick={() => toggleRowExpansion('folder', folder.folder_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title={isExpanded ? 'Hide documents' : 'Show documents'}
                            >
                              <FiChevronDown 
                                size={14} 
                                style={{ 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }} 
                              />
                            </button>
                          )}
                          <strong>{folder.name}</strong>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: folder.document_count > 0 ? '#dcfce7' : '#f3f4f6',
                          color: folder.document_count > 0 ? '#166534' : '#6b7280',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {folder.document_count || 0} docs
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(folder.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>{new Date(folder.updated_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={styles.editBtn} 
                            onClick={() => handleEditFolder(folder)}
                            title="Edit"
                            disabled={folder.folder_id === 999}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button 
                            style={styles.deleteBtn} 
                            onClick={() => handleDeleteFolder(folder.folder_id)}
                            title="Delete"
                            disabled={folder.folder_id === 999}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="5" style={{ ...styles.td, padding: '0', backgroundColor: '#f0fdf4' }}>
                          <div style={{ padding: '12px 16px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                              Documents in this folder:
                            </h4>
                            {documents.length > 0 ? (
                              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {documents.map(doc => (
                                  <div key={doc.doc_id} style={{
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '13px'
                                  }}>
                                    <div style={{ fontWeight: '500', color: '#111827' }}>{doc.title}</div>
                                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                      {doc.reference} • {new Date(doc.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading documents...</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {folders.length === 0 && (
            <div style={styles.emptyState}>
              <FiDatabase size={48} color="#ccc" />
              <p>No folders found. Add your first folder to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Document Type Modal */}
      {showDocTypeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingDocType ? 'Edit Document Type' : 'Add Document Type'}
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowDocTypeModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={docTypeForm.type_name}
                  onChange={(e) => setDocTypeForm({...docTypeForm, type_name: e.target.value})}
                  placeholder="Enter document type name"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.secondaryBtn} 
                onClick={() => setShowDocTypeModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.primaryBtn} 
                onClick={handleSaveDocumentType}
                disabled={!docTypeForm.type_name}
              >
                {editingDocType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Folder Modal */}
      {showFolderModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingFolder ? 'Edit Folder' : 'Add Folder'}
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowFolderModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Folder Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                  placeholder="Enter folder name"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.secondaryBtn} 
                onClick={() => setShowFolderModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.primaryBtn} 
                onClick={handleSaveFolder}
                disabled={!folderForm.name}
              >
                {editingFolder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const MaintenanceTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Maintenance Controls</h2>
      </div>

      <div style={styles.section}>
        <div style={styles.subsectionHeader}>
          <h3 style={styles.subsectionTitle}>Mode</h3>
          <div>
            <label style={{marginRight: 8}}>Status:</label>
            <button 
              style={{...styles.secondaryBtn, backgroundColor: maintenanceMode ? '#fee2e2' : '#e5e7eb', color: maintenanceMode ? '#b91c1c' : '#111827'}} 
              onClick={handleToggleMaintenanceMode}
              title={maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
            >
              {maintenanceMode ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Maintenance Message (optional)</label>
          <textarea
            style={{...styles.input, minHeight: 80, resize: 'vertical'}}
            placeholder="Short note users will see on the maintenance screen"
            value={maintenanceMessage}
            onChange={(e)=>setMaintenanceMessage(e.target.value)}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Maintenance Start Time (optional)</label>
          <input
            type="datetime-local"
            style={styles.input}
            value={maintenanceStartTime}
            onChange={(e)=>{ setMaintenanceStartTime(e.target.value); setValidationError(''); }}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Maintenance End Time (optional)</label>
          <input
            type="datetime-local"
            style={styles.input}
            value={maintenanceEndTime}
            onChange={(e)=>{ setMaintenanceEndTime(e.target.value); setValidationError(''); }}
          />
          <div style={{fontSize: 12, color: '#6b7280', marginTop: 6}}>Users will see a live countdown when an end time is set.</div>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Quick presets:</span>
          <button
            style={styles.secondaryBtn}
            type="button"
            onClick={() => {
              const now = new Date();
              const start = maintenanceStartTime ? new Date(maintenanceStartTime) : now;
              const end = new Date(start.getTime() + 30 * 60 * 1000);
              setMaintenanceStartTime(toDatetimeLocal(start));
              setMaintenanceEndTime(toDatetimeLocal(end));
              setValidationError('');
            }}
          >
            +30m
          </button>
          <button
            style={styles.secondaryBtn}
            type="button"
            onClick={() => {
              const now = new Date();
              const start = maintenanceStartTime ? new Date(maintenanceStartTime) : now;
              const end = new Date(start.getTime() + 60 * 60 * 1000);
              setMaintenanceStartTime(toDatetimeLocal(start));
              setMaintenanceEndTime(toDatetimeLocal(end));
              setValidationError('');
            }}
          >
            +1h
          </button>
          <button
            style={styles.secondaryBtn}
            type="button"
            onClick={() => {
              const now = new Date();
              const start = maintenanceStartTime ? new Date(maintenanceStartTime) : now;
              const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
              setMaintenanceStartTime(toDatetimeLocal(start));
              setMaintenanceEndTime(toDatetimeLocal(end));
              setValidationError('');
            }}
          >
            +2h
          </button>
        </div>

        {/* Live preview */}
        {previewText && (
          <div style={{ fontSize: 13, color: '#334155', marginTop: 8 }}>
            {previewText}
          </div>
        )}

        {validationError && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 6 }}>
            {validationError}
          </div>
        )}

        <div style={{display: 'flex', gap: 8, marginTop: 12}}>
          <button 
            style={{...styles.primaryBtn, opacity: (savingMaintenance || !!validationError) ? 0.7 : 1, cursor: (savingMaintenance || !!validationError) ? 'not-allowed' : 'pointer'}}
            onClick={handleSaveMaintenanceSettings}
            disabled={savingMaintenance || !!validationError}
          >
            {savingMaintenance ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );

  const ActionsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Action Management</h2>
        <button style={styles.primaryBtn} onClick={handleAddAction}>
          <FiPlus size={16} />
          Add Action
        </button>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Action Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actions.map(action => (
              <tr key={action.action_id} style={styles.tableRow}>
                <td style={styles.td}>
                  <strong>{action.action_name}</strong>
                </td>
                <td style={styles.td}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {action.action_description || 'No description'}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: action.action_category === 'decision' ? '#dbeafe' : 
                                   action.action_category === 'communication' ? '#dcfce7' :
                                   action.action_category === 'document_management' ? '#fef3c7' :
                                   action.action_category === 'administrative' ? '#f3e8ff' : '#f3f4f6',
                    color: action.action_category === 'decision' ? '#1e40af' : 
                          action.action_category === 'communication' ? '#166534' :
                          action.action_category === 'document_management' ? '#92400e' :
                          action.action_category === 'administrative' ? '#7c3aed' : '#374151'
                  }}>
                    {action.action_category}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: action.is_active ? '#dcfce7' : '#fee2e2',
                    color: action.is_active ? '#166534' : '#dc2626'
                  }}>
                    {action.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  {action.created_at ? new Date(action.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button 
                      style={styles.editBtn} 
                      onClick={() => handleEditAction(action)}
                      title="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button 
                      style={styles.deleteBtn} 
                      onClick={() => handleDeleteAction(action.action_id)}
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {actions.length === 0 && (
          <div style={styles.emptyState}>
            <FiActivity size={48} color="#ccc" />
            <p>No actions found. Add your first action to get started.</p>
          </div>
        )}
      </div>
      
      {/* Action Modal */}
      {showActionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingAction ? 'Edit Action' : 'Add Action'}
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowActionModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Action Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={actionForm.action_name}
                  onChange={(e) => setActionForm({...actionForm, action_name: e.target.value})}
                  placeholder="Enter action name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  value={actionForm.action_description}
                  onChange={(e) => setActionForm({...actionForm, action_description: e.target.value})}
                  placeholder="Enter action description"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  style={styles.input}
                  value={actionForm.action_category}
                  onChange={(e) => setActionForm({...actionForm, action_category: e.target.value})}
                >
                  <option value="decision">Decision</option>
                  <option value="communication">Communication</option>
                  <option value="document_management">Document Management</option>
                  <option value="administrative">Administrative</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input
                    type="checkbox"
                    checked={actionForm.is_active}
                    onChange={(e) => setActionForm({...actionForm, is_active: e.target.checked ? 1 : 0})}
                  />
                  Active
                </label>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.secondaryBtn} 
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.primaryBtn} 
                onClick={handleSaveAction}
                disabled={!actionForm.action_name}
              >
                {editingAction ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const DepartmentsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Department Management</h2>
        <button style={styles.primaryBtn} onClick={handleAddDepartment}>
          <FiPlus size={16} />
          Add Department
        </button>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Users</th>
              <th style={styles.th}>Documents</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => {
              const docRowKey = `department_${dept.department_id}`;
              const userRowKey = `department_users_${dept.department_id}`;
              const isDocExpanded = expandedRows.has(docRowKey);
              const isUserExpanded = expandedRows.has(userRowKey);
              const documents = rowDocuments[docRowKey] || [];
              const users = rowDocuments[userRowKey] || [];
              
              return (
                <React.Fragment key={dept.department_id}>
                  <tr style={styles.tableRow}>
                    <td style={styles.td}>
                      <strong>{dept.name}</strong>
                    </td>
                    <td style={styles.td}><span style={styles.badge}>{dept.code}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {dept.user_count > 0 && (
                          <button
                            onClick={() => toggleRowExpansion('department_users', dept.department_id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={isUserExpanded ? 'Hide users' : 'Show users'}
                          >
                            <FiChevronDown 
                              size={14} 
                              style={{ 
                                transform: isUserExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          </button>
                        )}
                        <span style={{
                          backgroundColor: dept.user_count > 0 ? '#e0f2fe' : '#f3f4f6',
                          color: dept.user_count > 0 ? '#0277bd' : '#6b7280',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {dept.user_count || 0} users
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {dept.document_count > 0 && (
                          <button
                            onClick={() => toggleRowExpansion('department', dept.department_id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={isDocExpanded ? 'Hide documents' : 'Show documents'}
                          >
                            <FiChevronDown 
                              size={14} 
                              style={{ 
                                transform: isDocExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }} 
                            />
                          </button>
                        )}
                        <span style={{
                          backgroundColor: dept.document_count > 0 ? '#fef3c7' : '#f3f4f6',
                          color: dept.document_count > 0 ? '#92400e' : '#6b7280',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {dept.document_count || 0} docs
                        </span>
                      </div>
                    </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button 
                      style={styles.editBtn} 
                      onClick={() => handleEditDepartment(dept)}
                      title="Edit"
                      disabled={dept.department_id === 999}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button 
                      style={styles.deleteBtn} 
                      onClick={() => handleDeleteDepartment(dept.department_id)}
                      title="Delete"
                      disabled={dept.department_id === 999}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
              {isUserExpanded && (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, padding: '0', backgroundColor: '#e1f5fe' }}>
                    <div style={{ padding: '12px 16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                        Users in this department:
                      </h4>
                      {users.length > 0 ? (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {users.map(user => (
                            <div key={user.user_id} style={{
                              padding: '8px 12px',
                              margin: '4px 0',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              fontSize: '13px'
                            }}>
                              <div style={{ fontWeight: '500', color: '#111827' }}>
                                {user.firstname} {user.lastname}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: '12px', display: 'flex', gap: '12px' }}>
                                <span>{user.user_email}</span>
                                <span>•</span>
                                <span style={{ 
                                  textTransform: 'capitalize',
                                  color: user.role === 'admin' ? '#dc2626' : user.role === 'dean' ? '#7c3aed' : '#059669'
                                }}>
                                  {user.role}
                                </span>
                                <span>•</span>
                                <span style={{
                                  color: user.user_status === 'Active' ? '#059669' : '#dc2626'
                                }}>
                                  {user.user_status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading users...</div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {isDocExpanded && (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, padding: '0', backgroundColor: '#fffbeb' }}>
                    <div style={{ padding: '12px 16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                        Documents in this department:
                      </h4>
                      {documents.length > 0 ? (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {documents.map(doc => (
                            <div key={doc.doc_id} style={{
                              padding: '8px 12px',
                              margin: '4px 0',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              fontSize: '13px'
                            }}>
                              <div style={{ fontWeight: '500', color: '#111827' }}>{doc.title}</div>
                              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                {doc.reference} • {new Date(doc.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading documents...</div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
          </tbody>
        </table>
        
        {departments.length === 0 && (
          <div style={styles.emptyState}>
            <FiSettings size={48} color="#ccc" />
            <p>No departments found. Add your first department to get started.</p>
          </div>
        )}
      </div>
      
      {/* Department Modal */}
      {showDeptModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button 
                style={styles.closeBtn} 
                onClick={() => setShowDeptModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Department Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                  placeholder="Enter department name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Department Code</label>
                <input
                  type="text"
                  style={styles.input}
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({...deptForm, code: e.target.value.toUpperCase()})}
                  placeholder="Enter department code (e.g., IT, HR)"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.secondaryBtn} 
                onClick={() => setShowDeptModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.primaryBtn} 
                onClick={handleSaveDepartment}
                disabled={!deptForm.name || !deptForm.code}
              >
                {editingDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const SystemTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>System Maintenance</h2>
        <button 
          style={styles.refreshBtn} 
          onClick={() => {
            fetchSystemHealth();
            fetchSystemLogs();
            fetchBackupHistory();
            fetchSystemStats();
          }}
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* System Health Monitoring */}
      <div style={styles.section}>
        <h3 style={styles.subsectionTitle}>System Health Monitoring</h3>
        <div style={styles.healthGrid}>
          <div style={styles.healthCard}>
            <div style={styles.healthHeader}>
              <FiActivity size={20} color={systemHealth.database?.status === 'healthy' ? '#10b981' : '#ef4444'} />
              <span style={styles.healthTitle}>Database</span>
            </div>
            <div style={styles.healthStatus}>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: systemHealth.database?.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                color: systemHealth.database?.status === 'healthy' ? '#166534' : '#dc2626'
              }}>
                {systemHealth.database?.status || 'Unknown'}
              </span>
              {systemHealth.database?.responseTime && (
                <span style={styles.healthDetail}>{systemHealth.database.responseTime}ms</span>
              )}
            </div>
          </div>

          <div style={styles.healthCard}>
            <div style={styles.healthHeader}>
              <FiBarChart size={20} color={systemHealth.memory?.status === 'healthy' ? '#10b981' : '#f59e0b'} />
              <span style={styles.healthTitle}>Memory</span>
            </div>
            <div style={styles.healthStatus}>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: systemHealth.memory?.status === 'healthy' ? '#dcfce7' : '#fef3c7',
                color: systemHealth.memory?.status === 'healthy' ? '#166534' : '#d97706'
              }}>
                {systemHealth.memory?.status || 'Unknown'}
              </span>
              {systemHealth.memory?.usage && (
                <span style={styles.healthDetail}>{systemHealth.memory.usage}MB / {systemHealth.memory.total}MB</span>
              )}
            </div>
          </div>

          <div style={styles.healthCard}>
            <div style={styles.healthHeader}>
              <FiClock size={20} color="#6366f1" />
              <span style={styles.healthTitle}>Uptime</span>
            </div>
            <div style={styles.healthStatus}>
              <span style={styles.healthDetail}>
                {systemHealth.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Backup Management */}
      <div style={styles.section}>
        <div style={styles.subsectionHeader}>
          <h3 style={styles.subsectionTitle}>Database Backup</h3>
          <button 
            style={{
              ...styles.primaryBtn,
              opacity: loadingBackup ? 0.6 : 1,
              cursor: loadingBackup ? 'not-allowed' : 'pointer'
            }}
            onClick={handleCreateBackup}
            disabled={loadingBackup}
          >
            <FiDatabase size={16} />
            {loadingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
        
        <div style={styles.backupContainer}>
          <div style={styles.backupStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Backups:</span>
              <span style={styles.statValue}>{backupHistory.length}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Last Backup:</span>
              <span style={styles.statValue}>
                {backupHistory[0] ? new Date(backupHistory[0].created).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
          
          <div style={styles.backupHistory}>
            <h4 style={styles.backupTitle}>Recent Backups</h4>
            {backupHistory.length > 0 ? (
              <div style={styles.backupList}>
                {backupHistory.slice(0, 5).map((backup, index) => (
                  <div key={index} style={styles.backupItem}>
                    <div style={styles.backupInfo}>
                      <span style={styles.backupName}>{backup.name}</span>
                      <span style={styles.backupDate}>{new Date(backup.created).toLocaleString()}</span>
                    </div>
                    <div style={styles.backupMeta}>
                      <span style={styles.backupSize}>{backup.size}</span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: backup.status === 'completed' ? '#dcfce7' : '#fef3c7',
                        color: backup.status === 'completed' ? '#166534' : '#d97706'
                      }}>
                        {backup.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No backups found</p>
            )}
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div style={styles.section}>
        <h3 style={styles.subsectionTitle}>System Logs</h3>
        <div style={styles.logsContainer}>
          {systemLogs.length > 0 ? (
            <div style={styles.logsList}>
              {systemLogs.slice(0, 10).map((log, index) => (
                <div key={index} style={styles.logItem}>
                  <div style={styles.logHeader}>
                    <span style={{
                      ...styles.logLevel,
                      backgroundColor: log.level === 'error' ? '#fee2e2' : log.level === 'warning' ? '#fef3c7' : '#e0f2fe',
                      color: log.level === 'error' ? '#dc2626' : log.level === 'warning' ? '#d97706' : '#0369a1'
                    }}>
                      {log.level || 'info'}
                    </span>
                    <span style={styles.logTime}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div style={styles.logMessage}>
                    {log.message || log.details || 'No message'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No logs available</p>
          )}
        </div>
      </div>

      {/* Cache Management & Maintenance Mode */}
      <div style={styles.actionsGrid}>
        <div style={styles.actionCard}>
          <div style={styles.actionHeader}>
            <FiRefreshCw size={24} color="#6366f1" />
            <h4 style={styles.actionTitle}>Cache Management</h4>
          </div>
          <p style={styles.actionDescription}>
            Clear system cache to improve performance and free up memory.
          </p>
          <button style={styles.actionButton} onClick={handleClearCache}>
            Clear Cache
          </button>
        </div>

        <div style={styles.actionCard}>
          <div style={styles.actionHeader}>
            <FiAlertTriangle size={24} color={maintenanceMode ? '#ef4444' : '#10b981'} />
            <h4 style={styles.actionTitle}>Maintenance Mode</h4>
          </div>
          <p style={styles.actionDescription}>
            {maintenanceMode ? 'System is currently in maintenance mode.' : 'Enable maintenance mode for system updates.'}
          </p>
          <button 
            style={{
              ...styles.actionButton,
              backgroundColor: maintenanceMode ? '#ef4444' : '#10b981',
              color: 'white'
            }}
            onClick={handleToggleMaintenanceMode}
          >
            {maintenanceMode ? 'Disable' : 'Enable'} Maintenance
          </button>
        </div>
      </div>

      {/* System Statistics */}
      <div style={styles.section}>
        <h3 style={styles.subsectionTitle}>System Statistics</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <FiFileText size={24} color="#6366f1" />
            <div style={styles.statContent}>
              <div style={styles.statValue}>{systemStats.documents || 0}</div>
              <div style={styles.statTitle}>Documents</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <FiUsers size={24} color="#10b981" />
            <div style={styles.statContent}>
              <div style={styles.statValue}>{systemStats.users || 0}</div>
              <div style={styles.statTitle}>Active Users</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <FiSettings size={24} color="#f59e0b" />
            <div style={styles.statContent}>
              <div style={styles.statValue}>{systemStats.departments || 0}</div>
              <div style={styles.statTitle}>Departments</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <FiDatabase size={24} color="#8b5cf6" />
            <div style={styles.statContent}>
              <div style={styles.statValue}>{systemStats.folders || 0}</div>
              <div style={styles.statTitle}>Folders</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderTabContent = () => {
    // Check if the current tab is available for the user's role
    const availableTabIds = tabs.map(tab => tab.id);
    
    if (!availableTabIds.includes(activeTab)) {
      // If current tab is not available, switch to the first available tab
      if (tabs.length > 0) {
        setActiveTab(tabs[0].id);
        return null; // Will re-render with correct tab
      }
    }

    switch (activeTab) {
      case 'documents': return <DocumentsTab />;
      case 'departments': return <DepartmentsTab />;
      case 'actions': return <ActionsTab />;
      case 'maintenance': 
        if (role === 'admin') {
          return <MaintenanceTab />;
        }
        return <div style={styles.tabContent}><p>Access denied. Only administrators can access maintenance settings.</p></div>;
      case 'system': 
        if (role === 'admin') {
          return <SystemTab />;
        }
        return <div style={styles.tabContent}><p>Access denied. Only administrators can access system settings.</p></div>;
      default: return <DocumentsTab />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
        <p style={styles.subtitle}>Manage your document management system</p>
      </div>

      <div style={styles.tabs}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {renderTabContent()}
      </div>
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
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
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
  },
  tabContent: {
    padding: '32px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
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
    fontSize: '24px',
    fontWeight: '700',
    color: '#111',
    marginBottom: '4px',
  },
  statTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  statTrend: {
    fontSize: '12px',
    fontWeight: '500',
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
    fontSize: '18px',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 16px 0',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  activityIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    background: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#111',
    marginBottom: '2px',
  },
  activityTime: {
    fontSize: '12px',
    color: '#666',
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
    fontSize: '14px',
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
  section: {
    marginBottom: '40px',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: '#f9fafb',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f9fafb',
    },
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#e5e7eb',
    color: '#374151',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e5e7eb',
    },
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#fef2f2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#fee2e2',
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111',
    margin: 0,
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#666',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f3f4f6',
    },
  },
  modalBody: {
    padding: '24px',
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '20px 24px',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#111',
    background: 'white',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#111',
      boxShadow: '0 0 0 3px rgba(17, 17, 17, 0.1)',
    },
  },
  subsectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 16px 0',
  },
  subsectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  healthCard: {
    padding: '20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  healthTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  healthDetail: {
    fontSize: '14px',
    color: '#666',
  },
  backupContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '24px',
  },
  backupStats: {
    background: 'white',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  backupHistory: {
    background: 'white',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  backupTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111',
    margin: '0 0 16px 0',
  },
  backupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  backupItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
  },
  backupInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  backupName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111',
  },
  backupDate: {
    fontSize: '12px',
    color: '#666',
  },
  backupMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backupSize: {
    fontSize: '12px',
    color: '#666',
  },
  logsContainer: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    maxHeight: '400px',
    overflow: 'auto',
  },
  logsList: {
    padding: '16px',
  },
  logItem: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  logLevel: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: '12px',
    color: '#666',
  },
  logMessage: {
    fontSize: '14px',
    color: '#111',
    lineHeight: '1.4',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    padding: '24px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
  },
  actionHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111',
    margin: 0,
  },
  actionDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  actionButton: {
    padding: '10px 20px',
    background: '#111',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyText: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    padding: '20px',
  },
};

export default AdminPanel;
