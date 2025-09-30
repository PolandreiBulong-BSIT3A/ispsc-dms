import React, { useState, useMemo, useEffect, useCallback } from 'react';
 import { Search, Eye, Download, Trash2, Pencil, Trash, ThreeDotsVertical, Funnel, XCircle, ArrowCounterclockwise, Check, Plus, Star, Pin, ArrowDownUp, ArrowUp, ArrowDown, InfoCircle } from 'react-bootstrap-icons';

import { useDocuments } from '../../contexts/DocumentContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { useUser } from '../../contexts/UserContext.jsx';
import { fetchUserPreferences, toggleFavorite, togglePin } from '../../lib/api/frontend/DocumentPreferencesClient.js';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';

const Document = ({ role, onOpenTrash, onNavigateToUpload, onNavigateToUpdate }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input to reduce re-renders during fast typing
  useEffect(() => {
    const debounceId = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(debounceId);
  }, [searchInput]);

  // Memoize normalized search string
  const lowerSearch = useMemo(() => (searchTerm || '').trim().toLowerCase(), [searchTerm]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [selectedCreatedBy, setSelectedCreatedBy] = useState('');
  const [selectedCopyType, setSelectedCopyType] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showTrashcan, setShowTrashcan] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    reference: '',
    from_field: '',
    to_field: '',
    date_received: '',
    doc_type: '',
    description: '',
    visible_to_all: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionDoc, setRevisionDoc] = useState(null);
  const [revisionForm, setRevisionForm] = useState({
    newGoogleDriveLink: '',
    revision: '',
    changeSummary: ''
  });
  const [versions, setVersions] = useState([]);
  // Cache for per-document visibility (departments, roles, users)
  const [docVisibilityMap, setDocVisibilityMap] = useState({});
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [massDeleteWarningOpen, setMassDeleteWarningOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [isMobile, setIsMobile] = useState(false);

  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showOnlyMyDocuments, setShowOnlyMyDocuments] = useState(false);
  const [userPreferences, setUserPreferences] = useState({}); // Store favorite and pin status
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Add near other useState declarations
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [propertiesDoc, setPropertiesDoc] = useState(null);
  // Edit modal visibility controls (Upload-like UI)
  const [editVisibilityMode, setEditVisibilityMode] = useState('all');
  const [editSelectedDepartments, setEditSelectedDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editSelectedUsers, setEditSelectedUsers] = useState([]);
  const [editSelectedRoles, setEditSelectedRoles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [draggedDocument, setDraggedDocument] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  // Add-to-folder dropdown state (3-dot menu action)
  const [addFolderDocId, setAddFolderDocId] = useState(null);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addFolderSearch, setAddFolderSearch] = useState('');
  // Carousel ref for folders
  const folderScrollRef = React.useRef(null);
  const [folderSearch, setFolderSearch] = useState('');

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openProperties = (doc) => {
    setPropertiesDoc(doc);
    setPropertiesOpen(true);
  };

  // Build list of folders that actually contain at least one currently visible document
  // (computed after filteredDocuments is defined; see placement below)
  // const visibleFolders = useMemo(...)

  const scrollFolders = (dir) => {
    const el = folderScrollRef.current;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // ==========================
  // Selection + Mass Delete
  // ==========================
  const handleSelectDocument = (docId, isSelected) => {
    setSelectedDocuments(prev => {
      const set = new Set(prev);
      if (isSelected) set.add(docId); else set.delete(docId);
      return Array.from(set);
    });
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      // Select all documents currently in the filtered list
      const ids = filteredDocuments.map(d => d.id);
      setSelectedDocuments(ids);
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleMassDelete = () => {
    if (!selectedDocuments || selectedDocuments.length === 0) return;
    setMassDeleteWarningOpen(true);
  };

  const cancelMassDelete = () => {
    setMassDeleteWarningOpen(false);
  };

  const confirmMassDelete = async () => {
    try {
      setMassDeleteWarningOpen(false);
      const ids = Array.from(new Set(selectedDocuments));
      if (ids.length === 0) return;

      let successCount = 0;
      const denied = [];
      const failed = [];

      for (const id of ids) {
        try {
          const resp = await fetch(buildUrl('documents/trashcan'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: id, action: 'move_to_trashcan' })
          });
          if (resp.ok) {
            successCount += 1;
          } else {
            const data = await resp.json().catch(() => ({}));
            if (resp.status === 403) {
              denied.push(id);
            } else {
              failed.push({ id, msg: data?.message || 'Failed' });
            }
          }
        } catch (e) {
          failed.push({ id, msg: e?.message || 'Network error' });
        }
      }

      // Feedback toast
      try {
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #111827; color: #fff; padding: 12px 16px; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18); font-weight: 500; max-width: 360px;
        `;
        const parts = [];
        if (successCount > 0) parts.push(`✅ Moved ${successCount} to trash`);
        if (denied.length > 0) parts.push(`🚫 ${denied.length} denied (other department)`);
        if (failed.length > 0) parts.push(`⚠️ ${failed.length} failed`);
        toast.textContent = parts.join(' • ');
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3500);
      } catch {}

      // Clear selections for the ones that were processed successfully
      setSelectedDocuments(prev => prev.filter(id => !ids.includes(id)));
      // Refresh list
      await refreshDocuments();
      // Also refresh notifications to reflect any backend-side signals
      try { fetchNotifications && fetchNotifications(true); } catch {}
    } catch (e) {
      console.error('Mass delete error:', e);
      alert('Mass delete encountered an error. Please try again.');
    }
  };

  // Robust helpers for visibility/access
  const parseList = (value, toLower = false) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => (toLower ? String(v).toLowerCase() : String(v)).trim()).filter(Boolean);
    return String(value)
      .split(',')
      .map(s => (toLower ? s.toLowerCase() : s).trim())
      .filter(Boolean);
  };

  const isPublic = (obj = {}) => {
    const candidates = [obj.visible_to_all, obj.visible_for_all, obj.visibility, obj.is_public, obj.public, obj.visibility_flag];
    for (const v of candidates) {
      if (v === true || v === 1) return true;
      if (typeof v === 'number' && v === 1) return true;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes' || s === 'all' || s === 'public' || s === 'everyone') return true;
      }
    }
    return false;
  };

  // Visibility badge helper (All vs Departments)
  const renderVisibilityTag = (doc) => {
    const publicFlag = isPublic(doc);
    if (publicFlag) {
      return (
        <span style={{
          display: 'inline-block',
          background: '#059669',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: 11,
          fontWeight: 600,
          marginTop: 4
        }} title="Visible to all users">
          All
        </span>
      );
    }
    // Build department names robustly
    let depts = (doc.department_names || '').split(',').map(s => s.trim()).filter(Boolean);
    // Try from visibility map cache
    if (depts.length === 0 && docVisibilityMap[doc.id || doc.doc_id]?.department_names) {
      depts = String(docVisibilityMap[doc.id || doc.doc_id].department_names).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (depts.length === 0) {
      // Try mapping department_ids -> names via departmentsList
      const idStr = (doc.department_ids || doc.departments || '').toString();
      const ids = idStr
        ? idStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      if (ids.length > 0 && Array.isArray(departmentsList) && departmentsList.length > 0) {
        const byId = new Map(departmentsList.map(d => [String(d.department_id ?? d.value), d.name ?? d.label]));
        const mapped = ids.map(id => byId.get(String(id))).filter(Boolean);
        if (mapped.length > 0) depts = mapped;
      }
    }
    if (depts.length === 0) {
      // Last resort: single-name fields
      const single = doc.department || doc.department_name || doc.dept_name || doc.college || '';
      if (single) depts = [String(single)];
    }
    // Build roles
    let roles = parseList(doc.allowed_roles || doc.roles || doc.visibility_roles, true);
    if ((!roles || roles.length === 0) && docVisibilityMap[doc.id || doc.doc_id]?.allowed_roles) {
      roles = parseList(docVisibilityMap[doc.id || doc.doc_id].allowed_roles, true);
    }

    // Build users (resolve IDs to names if possible)
    let userIds = parseList(doc.allowed_user_ids || doc.user_ids || doc.visibility_user_ids || doc.users);
    if (userIds.length === 0 && docVisibilityMap[doc.id || doc.doc_id]?.allowed_user_ids) {
      userIds = parseList(docVisibilityMap[doc.id || doc.doc_id].allowed_user_ids);
    }
    const userDisplay = userIds.map(uid => {
      const u = usersList.find(x => String(x.user_id) === String(uid));
      return u ? u.full_name : `User #${uid}`;
    });

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 }} title={[
        roles && roles.length ? `Roles: ${roles.map(r=>r.toUpperCase()).join(', ')}` : null,
        userDisplay.length ? `Users: ${userDisplay.join(', ')}` : null,
        depts.length ? `Departments: ${depts.join(', ')}` : null
      ].filter(Boolean).join(' | ')}>
        {roles && roles.length > 0 && (
          <>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginLeft: 6 }}>Roles:</span>
            {roles.map((r, idx) => (
              <span key={`role-${r}-${idx}`} style={{
                display: 'inline-block',
                background: '#6b7280',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: 11,
                fontWeight: 600,
              }}>{String(r).toUpperCase()}</span>
            ))}
          </>
        )}

        {userDisplay && userDisplay.length > 0 && (
          <>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginLeft: 6 }}>Users:</span>
            {userDisplay.slice(0, 3).map((name, idx) => (
              <span key={`user-${name}-${idx}`} style={{
                display: 'inline-block',
                background: '#059669',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: 11,
                fontWeight: 600,
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>{name}</span>
            ))}
            {userDisplay.length > 3 && (
              <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>+{userDisplay.length - 3} more</span>
            )}
          </>
        )}

        {depts.length > 0 && (
          <>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginLeft: 6 }}>Dept:</span>
            {depts.map((d, idx) => (
              <span key={`${d}-${idx}`} style={{
                display: 'inline-block',
                background: '#2563eb',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: 11,
                fontWeight: 600,
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>{d}</span>
            ))}
          </>
        )}
      </div>
    );
  };
  const closeProperties = () => {
    setPropertiesOpen(false);
    setPropertiesDoc(null);
  };

  // Format field names for display
  const formatFieldName = (key) => {
    const fieldMap = {
      'title': 'Title',
      'type': 'Type',
      'reference': 'Reference',
      'status': 'Status',
      'created_at': 'Created',
      'updated_at': 'Last Updated',
      'created_by_name': 'Created By',
      'department_name': 'Department',
      'sender': 'Sender',
      'receiver': 'Receiver',
      'date_received': 'Date Received',
      'google_drive_link': 'Drive Link',
      'description': 'Description',
      'folder_name': 'Folder',
      'is_favorite': 'Favorite',
      'is_archived': 'Archived'
    };
    return fieldMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Context hooks
  const { documents, loading, error, removeDocument, updateDocument, refreshDocuments, fetchDocumentVisibility } = useDocuments();
  const { fetchNotifications } = useNotifications();
  const { user: currentUser } = useUser();
  
  // Check if user is admin (will be redeclared below with role parameter)

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorFromString = (str) => {
    if (!str) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 75%)`;
  };

  const toggleDropdown = (docId) => {
    const willOpen = openDropdown !== docId;
    setOpenDropdown(willOpen ? docId : null);
    if (!willOpen) {
      // close any add-folder panel when closing dropdown
      setAddFolderDocId(null);
      setAddFolderOpen(false);
      setAddFolderSearch('');
    }
  };

  // Append a folder to a document by updating folder_ids via updateDocument()
  const appendFolderToDocument = async (doc, folderId) => {
    try {
      const currentCsv = (doc.folder_ids || '').toString();
      const currentIds = currentCsv ? currentCsv.split(',').map(s => Number(String(s).trim())).filter(Boolean) : [];
      const next = Array.from(new Set([...(currentIds || []), Number(folderId)])).filter(Boolean);
      // Include a no-op allowed field (title) to satisfy backend update validation
      const resp = await updateDocument(doc.id || doc.doc_id, { folder_ids: next, title: doc.title || '' });
      if (resp?.success) {
        // simple toast
        try {
          const toast = document.createElement('div');
          toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.18);font-weight:500;';
          const f = folders.find(f => Number(f.folder_id) === Number(folderId));
          toast.textContent = `Added to folder${f ? `: ${f.name}` : ''}`;
          document.body.appendChild(toast);
          setTimeout(() => { toast.remove(); }, 2000);
        } catch {}
        setAddFolderOpen(false);
        setAddFolderDocId(null);
        setAddFolderSearch('');
        await refreshDocuments();
      } else {
        alert(resp?.message || 'Failed to add to folder');
      }
    } catch (e) {
      console.error('appendFolderToDocument error:', e);
      alert('Failed to add to folder');
    }
  };

  // Remove a folder from a document's multi-folder mapping
  const removeFolderFromDocument = async (doc, folderId) => {
    try {
      const currentCsv = (doc.folder_ids || '').toString();
      const currentIds = currentCsv ? currentCsv.split(',').map(s => Number(String(s).trim())).filter(Boolean) : [];
      const next = currentIds.filter(id => Number(id) !== Number(folderId));
      const resp = await updateDocument(doc.id || doc.doc_id, { folder_ids: next });
      if (resp?.success) {
        try {
          const toast = document.createElement('div');
          toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.18);font-weight:500;';
          const f = folders.find(f => Number(f.folder_id) === Number(folderId));
          toast.textContent = `Removed from folder${f ? `: ${f.name}` : ''}`;
          document.body.appendChild(toast);
          setTimeout(() => { toast.remove(); }, 2000);
        } catch {}
        await refreshDocuments();
      } else {
        alert(resp?.message || 'Failed to remove from folder');
      }
    } catch (e) {
      console.error('removeFolderFromDocument error:', e);
      alert('Failed to remove from folder');
    }
  };

  const hasAdminPrivileges = (userRole) => {
    if (!userRole) return false;
    const role = userRole.toString().toLowerCase();
    return role === 'admin' || role === 'administrator' || role === 'dean';
  };

  // Determine access level for dean filtering
  const roleLower = (role || currentUser?.role || '').toString().toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'administrator';
      const isDean = roleLower === 'dean';
      const isUser = roleLower === 'faculty';
      const effectiveIsDean = isDean || (currentUser?.role === 'DEAN' || currentUser?.role === 'dean');

  // Sorting functionality
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon for column headers (icon components, no emojis)
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowDownUp size={14} style={{ marginLeft: 6, color: '#9ca3af' }} />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} style={{ marginLeft: 6, color: '#374151' }} />
      : <ArrowDown size={14} style={{ marginLeft: 6, color: '#374151' }} />;
  };

  // Drive preview helper
  const getDrivePreviewUrl = (link) => {
    if (!link) return null;
    
    // Handle Google Drive file links
    let match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    
    // Handle Google Docs
    match = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/document/d/${match[1]}/preview`;
    
    // Handle Google Sheets
    match = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
    
    // Handle Google Slides
    match = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/presentation/d/${match[1]}/preview`;
    
    // Handle direct file URLs that can be previewed in browser
    if (link.match(/\.(pdf|jpg|jpeg|png|gif|txt)$/i)) {
      return link;
    }
    
    return null;
  };

  // Drive download helper
  const getDriveDownloadUrl = (link) => {
    if (!link) return null;
    
    // Handle Google Drive file links
    let match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // Handle Google Docs
    match = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const docId = match[1];
      return `https://docs.google.com/document/d/${docId}/export?format=pdf`;
    }
    
    // Handle Google Sheets
    match = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const sheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    }
    
    // Handle Google Slides
    match = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const slideId = match[1];
      return `https://docs.google.com/presentation/d/${slideId}/export/pptx`;
    }
    
    // Handle direct file URLs (PDF, DOC, etc.)
    if (link.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i)) {
      return link;
    }
    
    // If it's a direct file link, return as is
    if (link.includes('drive.google.com') || link.includes('docs.google.com')) {
      return link;
    }
    
    return null;
  };

  // Get "Save to Drive" URL
  const getSaveToDriveUrl = (link) => {
    if (!link) return null;
    
    // Handle Google Drive file links
    let match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
    
    // Handle Google Docs
    match = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const docId = match[1];
      return `https://docs.google.com/document/d/${docId}/edit?usp=sharing`;
    }
    
    // Handle Google Sheets
    match = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const sheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`;
    }
    
    // Handle Google Slides
    match = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const slideId = match[1];
      return `https://docs.google.com/presentation/d/${slideId}/edit?usp=sharing`;
    }
    
    return null;
  };

  const openPreview = (doc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };
  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewDoc(null);
  };

  // Favorite and Pin functionality
  const fetchUserPreferencesData = async () => {
    try {
      const data = await fetchUserPreferences();
      const preferences = {};
      data.preferences.forEach(pref => {
        // Store preferences with both doc_id and id keys to handle both formats
        preferences[pref.doc_id] = {
          is_favorite: pref.is_favorite,
          is_pinned: pref.is_pinned
        };
        // Also store with id key for compatibility
        preferences[pref.doc_id.toString()] = {
          is_favorite: pref.is_favorite,
          is_pinned: pref.is_pinned
        };
      });
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const handleToggleFavorite = async (docId) => {
    console.log('Toggling favorite for document ID:', docId);
    try {
      await toggleFavorite(docId);
      // Update local state with both ID formats
      setUserPreferences(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          is_favorite: !prev[docId]?.is_favorite
        },
        [docId.toString()]: {
          ...prev[docId.toString()],
          is_favorite: !prev[docId]?.is_favorite
        }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleTogglePin = async (docId) => {
    try {
      await togglePin(docId);
      // Update local state with both ID formats
      setUserPreferences(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          is_pinned: !prev[docId]?.is_pinned
        },
        [docId.toString()]: {
          ...prev[docId.toString()],
          is_pinned: !prev[docId]?.is_pinned
        }
      }));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    console.log('=== FILTERING START ===');
    console.log('showOnlyMyDocuments:', showOnlyMyDocuments);
    console.log('currentUser:', currentUser);
    console.log('Total documents to filter:', documents.length);
    let filtered = documents.filter(doc => {
      // Check if document was created by the current user (for toggle functionality)
      const isCreatedByCurrentUser = doc.created_by_name && currentUser && (
        doc.created_by_name === currentUser.username ||
        doc.created_by_name === currentUser.firstname + ' ' + currentUser.lastname ||
        doc.created_by_name === currentUser.email ||
        doc.created_by_name === currentUser.Username ||
        doc.created_by_name === (currentUser.firstname && currentUser.lastname ? 
          `${currentUser.firstname} ${currentUser.lastname}`.trim() : '') ||
        doc.created_by_name === currentUser.firstname ||
        doc.created_by_name === currentUser.lastname ||
        doc.created_by_name === currentUser.name ||
        doc.created_by_name === currentUser.full_name ||
        doc.created_by_name === currentUser.display_name ||
        doc.created_by_name === currentUser.user_name ||
        doc.created_by_name === currentUser.user_id?.toString() ||
        doc.created_by_name === currentUser.id?.toString()
      );
      
      // If toggle is active, only show documents created by the current user (regardless of role)
      if (showOnlyMyDocuments && !isCreatedByCurrentUser) {
        console.log('Filtering out document:', doc.title, 'because toggle is active and user did not create it');
        console.log('Document created by:', doc.created_by_name);
        console.log('Current user details:', {
          username: currentUser?.username,
          firstname: currentUser?.firstname,
          lastname: currentUser?.lastname,
          email: currentUser?.email,
          id: currentUser?.id,
          name: currentUser?.name
        });
        return false;
      }
      
      // If toggle is active, log documents that are being shown
      if (showOnlyMyDocuments && isCreatedByCurrentUser) {
        console.log('Showing document:', doc.title, 'because user created it');
      }
      
          // Dean/Admin/User filtering: Only show documents from their department OR visible to all OR documents they created
    if ((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id) {
        const userDeptId = currentUser?.department_id;
        const userDept = currentUser?.department || 
                              currentUser?.department_name || 
                              currentUser?.dept_name ||
                              currentUser?.dept_code ||
                              currentUser?.college ||
                              currentUser?.college_name ||
                              currentUser?.faculty ||
                              currentUser?.faculty_name ||
                              currentUser?.unit ||
                              currentUser?.unit_name ||
                              '';
        
        // Public visibility
        const visibleAll = isPublic(doc);

        // Check if document belongs to user's department
        const belongsToUserDept = (userDeptId && doc.department_ids) ? 
          doc.department_ids.split(',').map(id => id.trim()).includes(userDeptId.toString()) :
          (userDept && doc.department_names) ?
          doc.department_names.toLowerCase().includes(userDept.toLowerCase()) : false;

        // Explicit user/role visibility
        const userIdStr = (currentUser?.id || currentUser?.user_id)?.toString();
        const roleStr = (currentUser?.role || '').toString().toLowerCase();
        const allowedUsers = parseList(doc.allowed_user_ids || doc.user_ids || doc.visibility_user_ids || doc.users);
        const allowedRoles = parseList(doc.allowed_roles || doc.roles || doc.visibility_roles, true);
        const allowedByUser = userIdStr ? allowedUsers.includes(userIdStr) : false;
        const allowedByRole = roleStr ? allowedRoles.includes(roleStr) : false;
        
        // Show if public OR belongs to dept OR creator OR explicitly allowed by user/role
        if (!visibleAll && !belongsToUserDept && !isCreatedByCurrentUser && !allowedByUser && !allowedByRole) {
          return false;
        }
      }
      
      const matchesSearch = !lowerSearch || (
        doc.title?.toLowerCase().includes(lowerSearch) ||
        doc.reference?.toLowerCase().includes(lowerSearch) ||
        doc.from_field?.toLowerCase().includes(lowerSearch) ||
        doc.to_field?.toLowerCase().includes(lowerSearch) ||
        doc.doc_type?.toLowerCase().includes(lowerSearch) ||
        doc.department_names?.toLowerCase().includes(lowerSearch)
      );
      
      const matchesCategory = !selectedCategory || doc.doc_type === selectedCategory;
      const matchesDepartment = (() => {
        if (!selectedDepartment) return true;
        // Always include public docs regardless of department filter
        if (isPublic(doc)) return true;
        // If explicitly allowed by user or role, bypass department filter
        const userIdStr = (currentUser?.id || currentUser?.user_id)?.toString();
        const roleStr = (currentUser?.role || '').toString().toLowerCase();
        const allowedUsers = parseList(doc.allowed_user_ids || doc.user_ids || doc.visibility_user_ids || doc.users);
        const allowedRoles = parseList(doc.allowed_roles || doc.roles || doc.visibility_roles, true);
        const allowedByUser = userIdStr ? allowedUsers.includes(userIdStr) : false;
        const allowedByRole = roleStr ? allowedRoles.includes(roleStr) : false;
        if (allowedByUser || allowedByRole) return true;
        // Creator can always see their document regardless of department filter
        if (isCreatedByCurrentUser) return true;
        const deptNames = (doc.department_names || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        return deptNames.includes(selectedDepartment.trim().toLowerCase());
      })();
      const matchesSender = (() => {
        if (!selectedSender) return true;
        return (doc.from_field || '').toString().trim() === selectedSender.toString().trim();
      })();
      const matchesReceiver = (() => {
        if (!selectedReceiver) return true;
        return (doc.to_field || '').toString().trim() === selectedReceiver.toString().trim();
      })();
      const matchesCreatedBy = (() => {
        if (!selectedCreatedBy) return true;
        return (doc.created_by_name || '').toString().trim() === selectedCreatedBy.toString().trim();
      })();
      const matchesCopyType = (() => {
        if (!selectedCopyType) return true;
        
        const hasSoftCopy = doc.google_drive_link && doc.google_drive_link.trim() !== '';
        const hasHardCopy = doc.hard_copy === 1 || doc.hard_copy === true || doc.hard_copy === '1';
        
        switch (selectedCopyType) {
          case 'soft':
            return hasSoftCopy;
          case 'hard':
            return hasHardCopy;
          case 'both':
            return hasSoftCopy && hasHardCopy;
          default:
            return true;
        }
      })();
      const matchesFolder = !selectedFolder || doc.folder === selectedFolder;
      const statusStr = (doc.status ?? '').toString().toLowerCase();
      const isActive = (statusStr === '' || statusStr === 'active' || statusStr === '1' || statusStr === 'enabled') && doc.deleted !== 1;
      
      return matchesSearch && matchesCategory && matchesDepartment && matchesSender && matchesReceiver && matchesCreatedBy && matchesCopyType && matchesFolder && isActive;
    });

    // Apply sorting with pinned documents first
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Always put pinned documents first
        const aPinned = userPreferences[a.id || a.doc_id]?.is_pinned || false;
        const bPinned = userPreferences[b.id || b.doc_id]?.is_pinned || false;
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // If both have same pin status, apply normal sorting
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        if (sortConfig.direction === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    } else {
      // If no sorting is applied, still put pinned documents first
      filtered.sort((a, b) => {
        const aPinned = userPreferences[a.id || a.doc_id]?.is_pinned || false;
        const bPinned = userPreferences[b.id || b.doc_id]?.is_pinned || false;
        
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
    }

    console.log('=== FILTERING END ===');
    console.log('Final filtered count:', filtered.length);
    console.log('Filtered documents:', filtered.map(d => ({ title: d.title, created_by: d.created_by_name })));
    
    return filtered;
  }, [documents, lowerSearch, selectedCategory, selectedDepartment, selectedSender, selectedReceiver, selectedCreatedBy, selectedCopyType, selectedFolder, sortConfig, showOnlyMyDocuments, currentUser, userPreferences]);

  // Build list of folders that actually contain at least one currently visible document
  const visibleFolders = useMemo(() => {
    const counts = new Map();
    filteredDocuments.forEach(doc => {
      const csv = (doc.folder_names || '').toString().trim();
      if (csv) {
        const names = csv.split(',').map(s => s.trim()).filter(Boolean);
        for (const name of names) {
          counts.set(name, (counts.get(name) || 0) + 1);
        }
        return;
      }
      if (doc.folder) {
        counts.set(doc.folder, (counts.get(doc.folder) || 0) + 1);
      }
    });
    const list = (folders || []).filter(f => counts.get(f.name) > 0).map(f => ({ ...f, count: counts.get(f.name) }));
    return list;
  }, [filteredDocuments, folders]);

  const filteredVisibleFolders = useMemo(() => {
    const q = (folderSearch || '').trim().toLowerCase();
    if (!q) return visibleFolders;
    return visibleFolders.filter(f => (f.name || '').toString().toLowerCase().includes(q));
  }, [visibleFolders, folderSearch]);

  // Pagination logic
  const totalItems = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDepartment, selectedSender, selectedReceiver, selectedCreatedBy, selectedCopyType, selectedFolder]);
  
  // Reset toggle when user changes
  useEffect(() => {
    setShowOnlyMyDocuments(false);
  }, [currentUser?.id]);

  // Fetch user preferences on component mount
  useEffect(() => {
    fetchUserPreferencesData();
  }, []);

  // Set user's department filter for users (disable department selection)
  useEffect(() => {
    if (isUser && currentUser?.department_id) {
      // For users, automatically set their department and disable the filter
      const userDepartment = currentUser.department || currentUser.department_name;
      if (userDepartment) {
        setSelectedDepartment(userDepartment);
      }
    }
  }, [isUser, currentUser]);

  // Fetch users for visibility editing
  const fetchUsersForEdit = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await fetchJson(buildUrl('users'), { method: 'GET' });
        const list = Array.isArray(data) ? data : Array.isArray(data.users) ? data.users : [];
        const normalized = list.map(u => ({
          user_id: u.user_id ?? u.id ?? u.userId,
          full_name: `${(u.firstname ?? u.first_name ?? u.firstName) || ''} ${(u.lastname ?? u.last_name ?? u.lastName) || ''}`.trim(),
          role: u.role ?? u.user_role
        })).filter(u => u.user_id && u.full_name);
        setUsersList(normalized.sort((a,b) => a.full_name.localeCompare(b.full_name)));
    } catch (e) {
      console.warn('Failed to fetch users list');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      setFoldersLoading(true);
      const data = await fetchJson(buildUrl('folders'), { method: 'GET' });
      if (data && data.success) {
        setFolders(data.folders || []);
      }
    } catch (e) {
      console.warn('Failed to fetch folders list');
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersForEdit();
    fetchFolders();
  }, [fetchUsersForEdit, fetchFolders]);

  // Drag and drop handlers
  const handleDragStart = (e, doc) => {
    // If the document is selected and there are multiple selected documents, drag all of them
    if (selectedDocuments.includes(doc.id) && selectedDocuments.length > 1) {
      setDraggedDocument({ 
        isMultiple: true, 
        count: selectedDocuments.length,
        ids: selectedDocuments,
        title: `${selectedDocuments.length} documents`
      });
    } else {
      setDraggedDocument(doc);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedDocument(null);
    setDragOverFolder(null);
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the folder area completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (!draggedDocument) {
      return;
    }

    // Check if it's the same folder
    if (!draggedDocument.isMultiple && draggedDocument.folder === targetFolder.name) {
      setDraggedDocument(null);
      return;
    }

    try {
      let response;
      
      if (draggedDocument.isMultiple) {
        // Mass move operation
        response = await fetch(`http://localhost:5000/api/documents/bulk/folder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            documentIds: draggedDocument.ids,
            folder: targetFolder.name 
          })
        });
      } else {
        // Single document move
        response = await fetch(`http://localhost:5000/api/documents/${draggedDocument.id}/folder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ folder: targetFolder.name })
        });
      }

      if (response.ok) {
        const data = await response.json();
        
        // Success - just refresh the documents list
        if (draggedDocument.isMultiple) {
          // Clear selected documents after successful move
          setSelectedDocuments([]);
          alert(`${draggedDocument.count} documents moved to "${targetFolder.name}" folder successfully!`);
        } else {
          alert(`Document moved to "${targetFolder.name}" folder successfully!`);
        }
        
        // Refresh documents to get updated data from server
        refreshDocuments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to move document(s). Please try again.');
      }
    } catch (error) {
      console.error('Error moving document(s):', error);
      alert('Error moving document(s). Please try again.');
    }
    
    setDraggedDocument(null);
  };

  // Action handlers
  const handleView = (doc) => {
    console.log('View document:', doc);
    
    // Check for any available file link
    const fileLink = doc.google_drive_link || doc.file_path || doc.file_url || doc.document_path;
    
    if (fileLink) {
      // Show preview notification
      const previewMessage = document.createElement('div');
      previewMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #8b5cf6;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
      `;
      previewMessage.textContent = '👁️ Opening preview in new tab...';
      document.body.appendChild(previewMessage);
      
      // Open file link in new tab
      const previewUrl = getDrivePreviewUrl(fileLink);
      if (previewUrl) {
        window.open(previewUrl, '_blank');
      } else {
        // If no preview URL available, open the original link
        window.open(fileLink, '_blank');
      }
      
      // Remove notification after 2 seconds
      setTimeout(() => {
        if (previewMessage.parentNode) {
          previewMessage.parentNode.removeChild(previewMessage);
        }
      }, 2000);
    } else {
      alert('No document link available for preview.');
    }
  };

  const handleDownload = (doc) => {
    console.log('Download document:', doc);
    
    // Check for any available file link
    const fileLink = doc.google_drive_link || doc.file_path || doc.file_url || doc.document_path;
    
    if (fileLink) {
      // Convert file link to direct download link
      const downloadUrl = getDriveDownloadUrl(fileLink);
      if (downloadUrl) {
        // Show download notification
        const downloadMessage = document.createElement('div');
        downloadMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        `;
        downloadMessage.textContent = '📥 Starting download...';
        document.body.appendChild(downloadMessage);
        
        // Create a temporary link element and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.title || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update message and remove after 3 seconds
        setTimeout(() => {
          downloadMessage.textContent = '✅ Download started!';
          downloadMessage.style.background = '#10b981';
          setTimeout(() => {
            if (downloadMessage.parentNode) {
              downloadMessage.parentNode.removeChild(downloadMessage);
            }
          }, 2000);
        }, 1000);
      } else {
        alert('Unable to generate download link for this document.');
      }
    } else {
      alert('No document link available for download.');
    }
  };

  const handleSaveToDrive = (doc) => {
    console.log('Save to Drive document:', doc);
    
    // Check for any available file link
    const fileLink = doc.google_drive_link || doc.file_path || doc.file_url || doc.document_path;
    
    if (fileLink) {
      // Show save to drive notification
      const saveMessage = document.createElement('div');
      saveMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4285f4;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
      `;
      saveMessage.textContent = '📁 Opening Google Drive...';
      document.body.appendChild(saveMessage);
      
      // Get the save to drive URL
      const saveToDriveUrl = getSaveToDriveUrl(fileLink);
      if (saveToDriveUrl) {
        // Open Google Drive in new tab
        window.open(saveToDriveUrl, '_blank');
        
        // Update message and remove after 3 seconds
        setTimeout(() => {
          saveMessage.textContent = '✅ Google Drive opened! Use "File > Make a copy" to save.';
          saveMessage.style.background = '#10b981';
          setTimeout(() => {
            if (saveMessage.parentNode) {
              saveMessage.parentNode.removeChild(saveMessage);
            }
          }, 3000);
        }, 1000);
      } else {
        // Fallback: open the original link
        window.open(fileLink, '_blank');
        setTimeout(() => {
          saveMessage.textContent = '✅ Document opened! You can save it to your Drive.';
          saveMessage.style.background = '#10b981';
          setTimeout(() => {
            if (saveMessage.parentNode) {
              saveMessage.parentNode.removeChild(saveMessage);
            }
          }, 3000);
        }, 1000);
      }
    } else {
      alert('No document link available to save to Drive.');
    }
  };

  // Alternative: Create a "Save to Drive" button using Google's API
  const createSaveToDriveButton = (doc) => {
    if (!doc.google_drive_link) return null;
    
    // This would require Google Drive API integration
    // For now, we'll use the simpler approach above
    return null;
  };

  const handleViewRevisions = async (doc) => {
    console.log('View revisions for:', doc);
    setRevisionDoc(doc);
    setRevisionForm({
      newGoogleDriveLink: '',
      revision: '',
      changeSummary: ''
    });
    
    try {
      const versions = await fetchDocumentVersions(doc.id || doc.doc_id);
      setVersions(versions);
      setRevisionOpen(true);
    } catch (error) {
      console.error('Error fetching versions:', error);
      alert('Failed to load document versions.');
    }
  };

  const closeRevision = () => {
    setRevisionOpen(false);
    setRevisionDoc(null);
    setVersions([]);
  };

  const handleRevisionChange = (e) => {
    const { name, value } = e.target;
    setRevisionForm(prev => ({ ...prev, [name]: value }));
  };

  const [focusedField, setFocusedField] = useState(null);
  const [editFocusedField, setEditFocusedField] = useState(null);

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleEditFocus = (fieldName) => {
    setEditFocusedField(fieldName);
  };

  const handleEditBlur = () => {
    setEditFocusedField(null);
  };

  const saveRevision = async () => {
    if (!revisionDoc) return;
    
    if (!revisionForm.newGoogleDriveLink.trim()) {
      alert('Please enter the new Google Drive link');
      return;
    }
    
    setIsCreatingRevision(true);
    
    try {
      const result = await createRevision(revisionDoc.id || revisionDoc.doc_id, {
        newGoogleDriveLink: revisionForm.newGoogleDriveLink.trim(),
        revision: revisionForm.revision.trim() || undefined,
        changeSummary: revisionForm.changeSummary.trim() || undefined
      });
      
      if (result.success) {
        closeRevision();
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        `;
        successMessage.textContent = `✅ Revision created successfully! (v${result.newVersion})`;
        document.body.appendChild(successMessage);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert(`Failed to create revision: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating revision:', error);
      alert('An error occurred while creating the revision. Please try again.');
    } finally {
      setIsCreatingRevision(false);
    }
  };

  const handleRestoreVersion = async (version) => {
    if (!revisionDoc || !version) return;
    
    if (!confirm(`Are you sure you want to restore version v${version.version_number}? This will make it the current version.`)) {
      return;
    }
    
    try {
      const result = await restoreVersion(revisionDoc.id || revisionDoc.doc_id, version.version_id);
      
      if (result.success) {
        // Refresh the versions list
        const updatedVersions = await fetchDocumentVersions(revisionDoc.id || revisionDoc.doc_id);
        setVersions(updatedVersions);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #8b5cf6;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        `;
        successMessage.textContent = `✅ Version v${version.version_number} restored successfully!`;
        document.body.appendChild(successMessage);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert(`Failed to restore version: ${result.message}`);
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('An error occurred while restoring the version. Please try again.');
    }
  };

  const handleEdit = (doc) => {
    const docId = doc?.id || doc?.doc_id;
    if (!docId) return;
    // Close the dropdown first to avoid any overlay capturing clicks
    setOpenDropdown(null);
    console.log('[Documents] Edit clicked for docId=', docId);
    // Prefer parent navigation if provided
    if (typeof onNavigateToUpdate === 'function') {
      onNavigateToUpdate(docId);
      return;
    }
    // Fallback: push a query param and rely on the app to switch view
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'update');
      url.searchParams.set('id', String(docId));
      window.history.pushState({}, '', url.toString());
    } catch (_) {
      window.location.search = `?view=update&id=${docId}`;
    }
  };

  const closeEdit = () => {
    setEditOpen(false);
    // Clear query params when closing the edit view
    setEditDoc(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    
    // Basic validation
    if (!editForm.title.trim()) {
      alert('Please enter a document title');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload = {
        title: editForm.title.trim(),
        reference: editForm.reference.trim(),
        from_field: editForm.from_field.trim(),
        to_field: editForm.to_field.trim(),
      date_received: editForm.date_received,
        category: editForm.doc_type, // Use 'category' instead of 'doc_type' for the API
        description: editForm.description.trim(),
      };
      // Compute visibility from Upload-like UI
      if (editVisibilityMode === 'all') {
        payload.visible_to_all = true;
        payload.department_ids = '';
      } else if (editVisibilityMode === 'specific') {
        payload.visible_to_all = false;
        payload.department_ids = (editSelectedDepartments || []).join(',');
      }
      // Optional targeting
      if (editSelectedUsers.length > 0) {
        payload.targetUsers = editSelectedUsers;
      }
      if (editSelectedRoles.length > 0) {
        payload.targetRoles = editSelectedRoles;
      }

      const result = await updateDocument(editDoc.id || editDoc.doc_id, payload);
      
      if (result.success) {
    closeEdit();
        // Show success message with a more modern approach
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        `;
        successMessage.textContent = '✓ Document updated successfully!';
        document.body.appendChild(successMessage);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert(`Failed to update document: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('An error occurred while updating the document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = (doc) => {
    if (!doc) return;
    setDocumentToDelete(doc);
    setDeleteWarningOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    const documentId = documentToDelete.id || documentToDelete.doc_id;
    await removeDocument(documentId);
    setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    successMessage.textContent = `✅ Document moved to trash successfully`;
    document.body.appendChild(successMessage);
    
    // Remove the message after 3 seconds
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.parentNode.removeChild(successMessage);
      }
    }, 3000);
    
    setDeleteWarningOpen(false);
    setDocumentToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteWarningOpen(false);
    setDocumentToDelete(null);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Fetch deleted documents when trashcan is shown
  

  // State for document types
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentTypesLoading, setDocumentTypesLoading] = useState(false);


  // State for departments
  const [departmentsList, setDepartmentsList] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Fetch document types from API
  const fetchDocumentTypes = useCallback(async () => {
    setDocumentTypesLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/document-types', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.documentTypes) {
          setDocumentTypes(data.documentTypes.map(dt => dt.type_name));
        }
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setDocumentTypesLoading(false);
    }
  }, []);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/departments', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.departments) {
          // Normalize department data
          const normalized = data.departments.map(d => ({
            department_id: d.value || d.department_id,
            name: d.label || d.name,
            code: d.code
          })).filter(d => d.name);
          setDepartmentsList(normalized);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  // Fetch document types and departments on component mount
  useEffect(() => {
    fetchDocumentTypes();
    fetchDepartments();
  }, [fetchDocumentTypes, fetchDepartments]);

  // Refresh documents when component mounts or when returning from upload
  useEffect(() => {
    // This ensures documents are up-to-date when returning from upload
    const refreshDocumentsList = async () => {
      try {
        // Force refresh documents to ensure we have the latest data
        await refreshDocuments();
      } catch (error) {
        console.error('Error refreshing documents:', error);
      }
    };
    
    refreshDocumentsList();
  }, [refreshDocuments]);

  // Show success message when documents are updated (indicating a new document was added)
  useEffect(() => {
    if (documents.length > 0 && !loading) {
      // Check if we're returning from upload by looking at the URL or session storage
      const isReturningFromUpload = sessionStorage.getItem('returningFromUpload');
      if (isReturningFromUpload) {
        setShowUploadSuccess(true);
        sessionStorage.removeItem('returningFromUpload');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowUploadSuccess(false);
        }, 3000);
      }
    }
  }, [documents.length, loading]);



  // Get unique categories and departments for filters
  const categories = useMemo(() => {
    // For deans and users, only show categories from their accessible documents
    let documentsToUse = documents;
    if ((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id && !showOnlyMyDocuments) {
      documentsToUse = documents.filter(doc => {
        const isVisibleToAll = doc.visible_to_all === 1 || doc.visible_to_all === true;
        const belongsToDeanDept = (currentUser.department_id && doc.department_ids) ? 
          doc.department_ids.split(',').map(id => id.trim()).includes(currentUser.department_id.toString()) :
          (currentUser.department || currentUser.department_name) ?
          doc.department_names?.toLowerCase().includes((currentUser.department || currentUser.department_name).toLowerCase()) : false;
        return isVisibleToAll || belongsToDeanDept;
      });
    }
    
    // First try to use document types from API
    if (documentTypes.length > 0) {
      return documentTypes.sort();
    }
    // Fallback to document types from accessible documents
    const uniqueCategories = [...new Set(documentsToUse.map(doc => doc.doc_type).filter(Boolean))];
    return uniqueCategories.sort();
  }, [documents, documentTypes, effectiveIsDean, isAdmin, isUser, currentUser, showOnlyMyDocuments]);

  const departments = useMemo(() => {
    // For users, only show their department
    if (isUser && currentUser?.department_id) {
      const userDepartment = currentUser.department || currentUser.department_name;
      return userDepartment ? [userDepartment] : [];
    }
    
    // First try to use departments from API
    if (departmentsList.length > 0) {
      return departmentsList.map(d => d.name).sort();
    }
    // Fallback to departments from existing documents
    const uniqueDepartments = [];
    documents.forEach(doc => {
      if (doc.department_names) {
        const deptNames = doc.department_names.split(', ');
        deptNames.forEach(name => {
          if (name && !uniqueDepartments.includes(name)) {
            uniqueDepartments.push(name);
          }
        });
      }
    });
    return uniqueDepartments.sort();
  }, [documents, departmentsList, isUser, currentUser]);

  const senders = useMemo(() => {
    // For deans and users, only show senders from their accessible documents
    let documentsToUse = documents;
    if ((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id && !showOnlyMyDocuments) {
      documentsToUse = documents.filter(doc => {
        const isVisibleToAll = doc.visible_to_all === 1 || doc.visible_to_all === true;
        const belongsToDeanDept = (currentUser.department_id && doc.department_ids) ? 
          doc.department_ids.split(',').map(id => id.trim()).includes(currentUser.department_id.toString()) :
          (currentUser.department || currentUser.department_name) ?
          doc.department_names?.toLowerCase().includes((currentUser.department || currentUser.department_name).toLowerCase()) : false;
        return isVisibleToAll || belongsToDeanDept;
      });
    }
    
    const uniqueSenders = [...new Set(documentsToUse.map(doc => doc.from_field).filter(Boolean))];
    return uniqueSenders.sort();
  }, [documents, effectiveIsDean, isAdmin, isUser, currentUser, showOnlyMyDocuments]);

  const receivers = useMemo(() => {
    // For deans and users, only show receivers from their accessible documents
    let documentsToUse = documents;
    if ((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id && !showOnlyMyDocuments) {
      documentsToUse = documents.filter(doc => {
        const isVisibleToAll = doc.visible_to_all === 1 || doc.visible_to_all === true;
        const belongsToDeanDept = (currentUser.department_id && doc.department_ids) ? 
          doc.department_ids.split(',').map(id => id.trim()).includes(currentUser.department_id.toString()) :
          (currentUser.department || currentUser.department_name) ?
          doc.department_names?.toLowerCase().includes((currentUser.department || currentUser.department_name).toLowerCase()) : false;
        return isVisibleToAll || belongsToDeanDept;
      });
    }
    
    const uniqueReceivers = [...new Set(documentsToUse.map(doc => doc.to_field).filter(Boolean))];
    return uniqueReceivers.sort();
  }, [documents, effectiveIsDean, isAdmin, isUser, currentUser, showOnlyMyDocuments]);

  const creators = useMemo(() => {
    // For deans and users, only show creators from their accessible documents
    let documentsToUse = documents;
    if ((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id && !showOnlyMyDocuments) {
      documentsToUse = documents.filter(doc => {
        const isVisibleToAll = doc.visible_to_all === 1 || doc.visible_to_all === true;
        const belongsToDeanDept = (currentUser.department_id && doc.department_ids) ? 
          doc.department_ids.split(',').map(id => id.trim()).includes(currentUser.department_id.toString()) :
          (currentUser.department || currentUser.department_name) ?
          doc.department_names?.toLowerCase().includes((currentUser.department || currentUser.department_name).toLowerCase()) : false;
        return isVisibleToAll || belongsToDeanDept;
      });
    }
    
    const uniqueCreators = [...new Set(documentsToUse.map(doc => doc.created_by_name).filter(Boolean))];
    return uniqueCreators.sort();
  }, [documents, effectiveIsDean, isAdmin, isUser, currentUser, showOnlyMyDocuments]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          /* Progressive column hiding for responsive table */
          @media (max-width: 768px) {
            .hide-on-small {
              display: none !important;
            }
          }
          
          @media (max-width: 992px) {
            .hide-on-medium {
              display: none !important;
            }
          }
          
          /* Mobile table optimizations */
          @media (max-width: 768px) {
            table {
              font-size: 14px;
            }
            th, td {
              padding: 8px 4px !important;
            }
            .btn-sm {
              padding: 4px 8px;
              font-size: 12px;
            }
            
            /* Mobile form button optimizations */
            .btn {
              padding: 8px 12px !important;
              font-size: 14px !important;
              min-height: 40px !important;
            }
            
            .btn-sm {
              padding: 6px 10px !important;
              font-size: 12px !important;
              min-height: 36px !important;
            }
            
            .rounded-circle {
              width: 36px !important;
              height: 36px !important;
              padding: 8px !important;
            }
          }
        `}
      </style>
      {/* Success Message */}
      {showUploadSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: '500',
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          Document uploaded successfully!
        </div>
      )}
      
      {/* Header */}
          <div style={{
            ...styles.header,
            ...(isMobile ? {
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'stretch'
            } : {})
          }}>
        <h1 style={{
          ...(isMobile ? {
            fontSize: '24px',
            textAlign: 'center',
            margin: '0'
          } : {})
        }}>Documents</h1>
        <div style={{ 
          display: 'flex', 
          gap: 8,
          ...(isMobile ? {
            flexDirection: 'column',
            gap: '12px'
          } : {})
        }}>
          {/* Hide Add Document button for users */}
          {!isUser && (
            <button 
              onClick={() => {
                if (onNavigateToUpload) {
                  onNavigateToUpload('upload');
                } else if (typeof window !== 'undefined') {
                  const evt = new CustomEvent('open-upload');
                  window.dispatchEvent(evt);
                }
              }} 
              className="btn btn-light border rounded-pill px-3"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
                ...(isMobile ? {
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  minHeight: '40px',
                  justifyContent: 'center'
                } : {})
              }}
            >
              <Plus size={16} />
              Add Document
            </button>
          )}




          {/* Hide View Trash button for users */}
          {!isUser && (
            <button onClick={() => (onOpenTrash ? onOpenTrash() : setShowTrashcan(true))} className="btn btn-light border rounded-pill px-3" style={{
              ...(isMobile ? {
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                minHeight: '40px',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center'
              } : {})
            }}>
              View Trash
            </button>
          )}
        </div>
          </div>



          {/* Search and Filters */}
      <div style={{
        ...styles.controls,
        ...(isMobile ? {
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'stretch'
        } : {})
      }}>
        <div style={{
          ...styles.leftControls,
          ...(isMobile ? {
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          } : {})
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={16} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                ...styles.searchInput,
                paddingLeft: '40px',
                ...(isMobile ? {
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  fontSize: '16px',
                  borderRadius: '12px'
                } : {
                  paddingLeft: '40px'
                })
              }}
            />
          </div>
        
          <button
            className="btn btn-light btn-sm border rounded-pill"
            title="Filters"
            onClick={() => setFiltersOpen(prev => !prev)}
            style={{ 
              padding: '8px 16px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              fontSize: '14px',
              ...(isMobile ? {
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                minHeight: '48px'
              } : {})
            }}
          >
            <Funnel />
            {isMobile ? 'Show Filters' : 'Filters'}
          </button>
          
          {/* Hide mass delete for users */}
          {selectedDocuments.length > 0 && !isUser && (
            <button
              className="rounded-pill"
              onClick={handleMassDelete}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                height: '36px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#e11d48',
                border: 'none',
                borderRadius: '9999px',
                transition: 'filter 0.15s ease',
                whiteSpace: 'nowrap',
                flexWrap: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
                ...(isMobile ? {
                  width: '100%',
                  padding: '10px 16px',
                  height: '44px',
                  fontSize: '16px',
                  justifyContent: 'center'
                } : {})
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
              title={`Move ${selectedDocuments.length} item(s) to Trash`}
            >
              <Trash2 color="#ffffff" size={16} />
              <span>Delete Selected</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700
              }}>({selectedDocuments.length})</span>
            </button>
          )}
          
          {filtersOpen && (
            <div style={{
              ...styles.filterPopover,
              ...(isMobile ? {
                position: 'static',
                width: '100%',
                boxShadow: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '8px'
              } : {})
            }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: isMobile ? '16px' : '14px' }}>Filters</div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr', 
                gap: isMobile ? '12px' : '6px 10px', 
                marginBottom: 12 
              }}>
                {!isMobile && <div>Category</div>}
                <div>
                  {isMobile && <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Category</label>}
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ 
                    width: '100%', 
                    padding: isMobile ? '12px 16px' : '8px 12px',
                    borderRadius: isMobile ? '12px' : '20px',
                    border: '1px solid #d1d5db',
                    fontSize: isMobile ? '16px' : '14px',
                    backgroundColor: '#fff',
                    minHeight: isMobile ? '48px' : 'auto'
                  }}>
                    <option value="">All Categories</option>
                    {documentTypesLoading ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : categories.length > 0 ? (
                      categories.map(c => {
                        const count = documents.filter(doc => doc.doc_type === c).length;
                        return <option key={c} value={c}>{c} ({count})</option>;
                      })
                    ) : (
                      <option value="" disabled>No categories available</option>
                    )}
                  </select>
                </div>
                        {/* Department filter visible only for ADMIN */}
        {isAdmin && (
                  <>
                    {!isMobile && <div>Department</div>}
                    <div>
                      {isMobile && <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>Department</label>}
                      <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ 
                        width: '100%', 
                        padding: isMobile ? '12px 16px' : '8px 12px',
                        borderRadius: isMobile ? '12px' : '20px',
                        border: '1px solid #d1d5db',
                        fontSize: isMobile ? '16px' : '14px',
                        backgroundColor: '#fff',
                        minHeight: isMobile ? '48px' : 'auto'
                      }}>
                        <option value="">All Departments</option>
                        {departmentsLoading ? (
                          <option value="" disabled>Loading departments...</option>
                        ) : departments.length > 0 ? (
                          departments.map(d => {
                            const count = documents.filter(doc => 
                              doc.department_names && doc.department_names.includes(d)
                            ).length;
                            return <option key={d} value={d}>{d} ({count})</option>;
                          })
                        ) : (
                          <option value="" disabled>No departments available</option>
                        )}
                      </select>
                    </div>
                  </>
                )}
                <div>Sender</div>
                <div>
                  <select value={selectedSender} onChange={(e) => setSelectedSender(e.target.value)} style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}>
                    <option value="">All Senders</option>
                    {senders.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>Receiver</div>
                <div>
                  <select value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)} style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}>
                    <option value="">All Receivers</option>
                    {receivers.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>Created By</div>
                <div>
                  <select value={selectedCreatedBy} onChange={(e) => setSelectedCreatedBy(e.target.value)} style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}>
                    <option value="">All Creators</option>
                    {creators.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>Available Copy</div>
                <div>
                  <select value={selectedCopyType} onChange={(e) => setSelectedCopyType(e.target.value)} style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}>
                    <option value="">All Copy Types</option>
                    <option value="soft">Soft Copy Only</option>
                    <option value="hard">Hard Copy Only</option>
                    <option value="both">Both Soft & Hard Copy</option>
                  </select>
                </div>
                <div>Folder</div>
                <div>
                  <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}>
                    <option value="">All Folders</option>
                    {foldersLoading ? (
                      <option value="" disabled>Loading folders...</option>
                    ) : folders.length > 0 ? (
                      folders.map(folder => {
                        const count = documents.filter(doc => doc.folder === folder.name).length;
                        return <option key={folder.folder_id} value={folder.name}>{folder.name} ({count})</option>;
                      })
                    ) : (
                      <option value="" disabled>No folders available</option>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button className="btn btn-light btn-sm border rounded-pill px-3" onClick={() => setFiltersOpen(false)}>Apply</button>
                <button className="btn btn-light btn-sm border rounded-pill px-3" onClick={() => { 
                  setSelectedCategory(''); 
                  setSelectedCopyType('');
                  setSelectedFolder('');
                          // Only clear department if not a dean or user
        if (!((effectiveIsDean || isAdmin || isUser) && currentUser?.department_id)) {
                    setSelectedDepartment(''); 
                  }
                  setSelectedSender(''); 
                  setSelectedReceiver(''); 
                  setSelectedCreatedBy(''); 
                  setSearchTerm(''); 
                }}>Clear <XCircle style={{ verticalAlign: 'middle' }} /></button>
              </div>
            </div>
          )}
                      </div>

        {/* View Options */}
        <div style={{
          ...styles.viewOptions,
          ...(isMobile ? { display: 'none' } : {})
        }}>
                      {/* Dean/Admin Quick Filters */}
            {(effectiveIsDean || isAdmin) && currentUser?.department_id && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginRight: '16px',
              alignItems: 'center'
            }}>
              <button
                className="btn btn-light btn-sm border rounded-pill px-4 py-2"
                onClick={() => {
                  console.log('Toggle clicked! Current state:', showOnlyMyDocuments);
                  setShowOnlyMyDocuments(!showOnlyMyDocuments);
                  // Clear other filters when toggling
                  setSelectedCategory('');
                                  // Only clear department if not a dean
                if (!((effectiveIsDean || isAdmin) && currentUser?.department_id)) {
                    setSelectedDepartment('');
                  }
                  setSelectedSender('');
                  setSelectedReceiver('');
                  setSelectedCreatedBy('');
                  setSearchTerm('');
                  console.log('New state will be:', !showOnlyMyDocuments);
                }}
                title={showOnlyMyDocuments ? "Show all accessible documents" : "Show only documents you created"}
                style={{ 
                  fontSize: '14px',
                  backgroundColor: showOnlyMyDocuments ? '#e3f2fd' : '#fff',
                  color: showOnlyMyDocuments ? '#1976d2' : '#333',
                  borderColor: showOnlyMyDocuments ? '#1976d2' : '#dee2e6'
                }}
              >
                {showOnlyMyDocuments ? "Show All" : "My Documents"} {showOnlyMyDocuments ? "←" : "→"}
              </button>

            </div>
          )}
          
          <span style={styles.viewLabel}>View:</span>
          <div style={styles.viewButtons}>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-light'} border rounded-circle`}
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"/>
              </svg>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'} border rounded-circle`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-light'} border rounded-circle`}
              onClick={() => setViewMode('list')}
              title="List View"
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {visibleFolders.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'space-between'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            <span>Folders</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder="Search folders..."
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '16px',
                  fontSize: '12px',
                  width: isMobile ? '140px' : '200px',
                  background: '#fff'
                }}
              />
              <button className="btn btn-light btn-sm border rounded-circle" title="Scroll left" onClick={() => scrollFolders('left')}>
                «
              </button>
              <button className="btn btn-light btn-sm border rounded-circle" title="Scroll right" onClick={() => scrollFolders('right')}>
                »
              </button>
            </span>
          </h3>
          <div ref={folderScrollRef} style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollSnapType: 'x mandatory'
          }}>
            {filteredVisibleFolders.map(folder => {
              const docCount = folder.count;
              const isSelected = selectedFolder === folder.name;
              const isDragOver = dragOverFolder === folder.folder_id;
              
              return (
                <div
                  key={folder.folder_id}
                  onClick={() => setSelectedFolder(isSelected ? '' : folder.name)}
                  onDragOver={(e) => handleDragOver(e, folder.folder_id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder)}
                  style={{
                    position: 'relative',
                    paddingTop: '12px',
                    paddingRight: '12px',
                    paddingBottom: '12px',
                    paddingLeft: '12px',
                    backgroundColor: isDragOver ? '#fef3c7' : (isSelected ? '#dbeafe' : '#fff'),
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: isDragOver ? '#f59e0b' : (isSelected ? '#3b82f6' : '#e2e8f0'),
                    borderRadius: '8px',
                    cursor: draggedDocument ? 'copy' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isDragOver ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                    minWidth: '220px',
                    scrollSnapAlign: 'start'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isDragOver) {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.borderColor = '#3b82f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isDragOver) {
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isSelected ? '#3b82f6' : '#6b7280',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '500',
                      fontSize: '14px',
                      color: isSelected ? '#1e40af' : '#374151',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {folder.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {docCount} document{docCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {isDragOver && draggedDocument && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#f59e0b',
                      pointerEvents: 'none'
                    }}>
                      📁 Drop {draggedDocument.isMultiple ? `${draggedDocument.count} documents` : `"${draggedDocument.title}"`} here
                    </div>
                  )}
                  {isSelected && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedFolder && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Showing documents in "{selectedFolder}" folder</span>
              <button
                onClick={() => setSelectedFolder('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1e40af',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <XCircle size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document Views */}
      {viewMode === 'table' && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <div 
                  style={{
                    ...styles.checkbox,
                    ...(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 ? styles.checkboxChecked : {})
                  }}
                  onClick={() => handleSelectAll(selectedDocuments.length !== filteredDocuments.length)}
                >
                  {(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
              </th>
              <th style={styles.th}>
                <button onClick={() => handleSort('title')} style={styles.sortBtn}>File Name {getSortIcon('title')}</button>
              </th>
              <th style={styles.th} className="hide-on-small">
                <button onClick={() => handleSort('doc_type')} style={styles.sortBtn}>Doc Type {getSortIcon('doc_type')}</button>
              </th>
              <th style={styles.th} className="hide-on-medium">
                <button onClick={() => handleSort('created_by_name')} style={styles.sortBtn}>Created By {getSortIcon('created_by_name')}</button>
              </th>
              <th style={styles.th} className="hide-on-small">
                <button onClick={() => handleSort('created_at')} style={styles.sortBtn}>Date Created {getSortIcon('created_at')}</button>
              </th>
              <th style={styles.th} className="hide-on-medium">
                <button onClick={() => handleSort('updated_at')} style={styles.sortBtn}>Last Updated {getSortIcon('updated_at')}</button>
              </th>
              <th style={styles.th}>Actions</th>
             </tr>
           </thead>
          <tbody>
                       {paginatedDocuments.map((doc) => (
                 <tr 
                   key={doc.id} 
                   style={styles.tableRow}
                   draggable={hasAdminPrivileges(role) && openDropdown !== doc.id}
                   onDragStart={(e) => handleDragStart(e, doc)}
                   onDragEnd={handleDragEnd}
                 >
                                     <td style={{...styles.td, ...styles.tableRowFirstCell}}>
                      <div 
                        style={{
                          ...styles.checkbox,
                          ...(selectedDocuments.includes(doc.id) ? styles.checkboxChecked : {})
                        }}
                        onClick={() => handleSelectDocument(doc.id, !selectedDocuments.includes(doc.id))}
                      >
                        {selectedDocuments.includes(doc.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                 </td>
                 <td style={{...styles.td, cursor: 'pointer', color: '#0d6efd'}} onClick={() => openPreview(doc)} title="Click to preview">
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span>{doc.title || 'Untitled'}</span>
                    {renderVisibilityTag(doc)}
                  </div>
                </td>
               <td style={styles.td} className="hide-on-small">{doc.doc_type || '-'}</td>
                                   <td style={{...styles.td, ...styles.tableRowLastCell}} className="hide-on-medium">
                     <div style={{display:'flex', alignItems:'center', gap:8}}>
                      {doc.created_by_profile_pic ? (
                        <img src={doc.created_by_profile_pic} alt="avatar" style={{width:28, height:28, borderRadius:'50%', objectFit:'cover'}} />
                      ) : (
                        <div style={{width:28, height:28, borderRadius:'50%', background:getColorFromString(doc.created_by_name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#1f2937'}}>
                          {getInitials(doc.created_by_name)}
                        </div>
                      )}
                      <div>
                        <div style={{fontWeight:500, fontSize:14}}>{doc.created_by_name || 'Unknown'}</div>
                        {(effectiveIsDean || isAdmin) && doc.created_by_name && currentUser && (
                          doc.created_by_name === currentUser.username ||
                          doc.created_by_name === currentUser.firstname + ' ' + currentUser.lastname ||
                          doc.created_by_name === currentUser.email ||
                          doc.created_by_name === currentUser.Username ||
                          doc.created_by_name === (currentUser.firstname && currentUser.lastname ? 
                            `${currentUser.firstname} ${currentUser.lastname}`.trim() : '') ||
                          doc.created_by_name === currentUser.firstname ||
                          doc.created_by_name === currentUser.lastname ||
                          doc.created_by_name === currentUser.name ||
                          doc.created_by_name === currentUser.full_name ||
                          doc.created_by_name === currentUser.display_name ||
                          doc.created_by_name === currentUser.user_name ||
                          doc.created_by_name === currentUser.user_id?.toString() ||
                          doc.created_by_name === currentUser.id?.toString()
                        ) && (
                          <span style={{fontSize:10, background:'#10b981', color:'white', padding:'2px 6px', borderRadius:10, fontWeight:600}}>MY DOC</span>
                        )}
                      </div>
                     </div>
                 </td>
                 <td style={styles.td} className="hide-on-small">{doc.created_at ? (doc.created_at.split('T')[0] || doc.created_at) : '-'}</td>
                 <td style={styles.td} className="hide-on-medium">{doc.updated_at ? (doc.updated_at.split('T')[0] || doc.updated_at) : '-'}</td>
                  <td style={{...styles.td, ...styles.tableRowLastCell}}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, position: 'relative' }}>
                      <button 
                        className="btn btn-light btn-sm border rounded-circle" 
                        onClick={() => handleTogglePin(doc.id || doc.doc_id)} 
                        title={userPreferences[doc.id || doc.doc_id]?.is_pinned ? "Unpin" : "Pin"}
                        style={{ color: userPreferences[doc.id || doc.doc_id]?.is_pinned ? '#f59e0b' : '#6b7280' }}
                      >
                        <Pin />
                      </button>
                      <button 
                        className="btn btn-light btn-sm border rounded-circle" 
                        onClick={() => handleToggleFavorite(doc.id || doc.doc_id)} 
                        title={userPreferences[doc.id || doc.doc_id]?.is_favorite ? "Remove from favorites" : "Add to favorites"} 
                        style={{ color: userPreferences[doc.id || doc.doc_id]?.is_favorite ? '#fbbf24' : '#6b7280' }}
                      >
                        <Star />
                      </button>
                      <button 
                        className="btn btn-light btn-sm border rounded-circle" 
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(doc.id); }} 
                        title="More actions"
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ThreeDotsVertical size={14} />
                      </button>
                      {openDropdown === doc.id && (
                        <div style={{...styles.dropdown, top: '120%'}} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                          <ul style={styles.menuList}>
                            <li style={styles.menuItem} onClick={(e) => { e.stopPropagation(); handleView(doc); }}>
                              <span style={styles.menuIcon}><Eye /></span>
                              <span style={styles.menuLabel}>Open</span>
                            </li>
                            <li style={styles.menuItem} onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                              <span style={styles.menuIcon}><Download /></span>
                              <span style={styles.menuLabel}>Download</span>
                            </li>
                            <li style={styles.menuItem} onClick={(e) => { e.stopPropagation(); handleSaveToDrive(doc); }}>
                              <span style={styles.menuIcon}><Download /></span>
                              <span style={styles.menuLabel}>Save to Drive</span>
                            </li>
                            <li style={styles.menuDivider} />
                            <li style={styles.menuItem} onClick={(e) => { e.stopPropagation(); openProperties(doc); }}>
                              <span style={styles.menuIcon}><InfoCircle /></span>
                              <span style={styles.menuLabel}>Properties</span>
                            </li>
                            <li style={styles.menuDivider} />
                            <li
                              style={styles.menuItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddFolderDocId(doc.id);
                                setAddFolderOpen(v => !v || addFolderDocId !== doc.id);
                              }}
                            >
                              <span style={styles.menuIcon}>📁</span>
                              <span style={styles.menuLabel}>Add to Folder</span>
                            </li>
                            {addFolderOpen && addFolderDocId === doc.id && (
                              <li style={{ padding: 8 }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#fff', width: 240 }}>
                                  <input
                                    type="text"
                                    value={addFolderSearch}
                                    onChange={(e) => setAddFolderSearch(e.target.value)}
                                    placeholder="Search folders..."
                                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 8 }}
                                  />
                                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {(folders || [])
                                      .filter(f => (f.name || '').toLowerCase().includes((addFolderSearch || '').toLowerCase()))
                                      .map(f => (
                                        <button
                                          key={`add-folder-${doc.id}-${f.folder_id}`}
                                          type="button"
                                          onClick={() => appendFolderToDocument(doc, f.folder_id)}
                                          style={{
                                            width: '100%', textAlign: 'left', padding: '6px 8px',
                                            border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, cursor: 'pointer'
                                          }}
                                        >
                                          {f.name}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              </li>
                            )}
                            {hasAdminPrivileges(role) && (
                              <>
                                <li style={styles.menuDivider} />
                                <li style={styles.menuItem} onMouseDown={(e) => { e.stopPropagation(); handleEdit(doc); }}>
                                  <span style={styles.menuIcon}><Pencil /></span>
                                  <span style={styles.menuLabel}>Edit</span>
                                </li>
                                <li style={{...styles.menuItem, color: '#dc2626'}} onClick={(e) => { e.stopPropagation(); handleSoftDelete(doc); }}>
                                  <span style={{...styles.menuIcon, color: '#dc2626'}}><Trash2 /></span>
                                  <span style={styles.menuLabel}>Move to Trash</span>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                 </td>
                </tr>
              ))}
            </tbody>
          </table>
      )}

      {viewMode === 'grid' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 8, gap: 8 }}>
            <div 
              style={{
                ...styles.checkbox,
                ...(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 ? styles.checkboxChecked : {})
              }}
              onClick={() => handleSelectAll(selectedDocuments.length !== filteredDocuments.length)}
              title={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 ? 'Deselect all' : 'Select all'}
            >
              {(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </div>
            <span style={{ color: '#374151', fontSize: 12 }}>Select All</span>
          </div>
          <div style={styles.gridContainer}>
          {paginatedDocuments.map((doc) => (
            <div key={doc.id} style={styles.gridCard} onClick={() => openPreview(doc)}>
              <div style={styles.gridCardHeader}>
                <div
                  role="checkbox"
                  aria-checked={selectedDocuments.includes(doc.id)}
                  onClick={(e) => { e.stopPropagation(); handleSelectDocument(doc.id, !selectedDocuments.includes(doc.id)); }}
                  style={{
                    ...styles.checkbox,
                    ...(selectedDocuments.includes(doc.id) ? styles.checkboxChecked : {})
                  }}
                >
                  {selectedDocuments.includes(doc.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                                <div style={styles.gridCardActions}>
                  <button 
                    className="btn btn-light btn-sm border rounded-circle" 
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(doc.id || doc.doc_id); }} 
                    title={userPreferences[doc.id || doc.doc_id]?.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    style={{ color: userPreferences[doc.id || doc.doc_id]?.is_favorite ? '#fbbf24' : '#6b7280' }}
                  >
                    <Star />
                  </button>
                  <button 
                    className="btn btn-light btn-sm border rounded-circle" 
                    onClick={(e) => { e.stopPropagation(); handleTogglePin(doc.id || doc.doc_id); }} 
                    title={userPreferences[doc.id || doc.doc_id]?.is_pinned ? "Unpin" : "Pin"}
                    style={{ color: userPreferences[doc.id || doc.doc_id]?.is_pinned ? '#f59e0b' : '#6b7280' }}
                  >
                    <Pin />
                  </button>
                    {/* 3-dot dropdown menu */}
                    <div className="dropdown-container" style={{ position: 'relative' }}>
                      <button 
                        className="btn btn-light btn-sm border rounded-circle" 
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(doc.id); }} 
                        title="More actions"
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ThreeDotsVertical size={14} />
                      </button>
                      {openDropdown === doc.id && (
                        <div style={styles.dropdown}>
                          <ul style={styles.menuList}>
                            <li style={styles.menuItem} onClick={() => handleView(doc)}>
                              <span style={styles.menuIcon}><Eye /></span>
                              <span style={styles.menuLabel}>Open</span>
                            </li>
                            <li style={styles.menuItem} onClick={() => handleDownload(doc)}>
                              <span style={styles.menuIcon}><Download /></span>
                              <span style={styles.menuLabel}>Download</span>
                            </li>
                            <li style={styles.menuItem} onClick={() => handleSaveToDrive(doc)}>
                              <span style={styles.menuIcon}><Download /></span>
                              <span style={styles.menuLabel}>Save to Drive</span>
                            </li>
                            <li style={styles.menuDivider} />
                            <li style={styles.menuItem} onClick={() => openProperties(doc)}>
                              <span style={styles.menuIcon}><InfoCircle /></span>
                              <span style={styles.menuLabel}>Properties</span>
                            </li>
                  {hasAdminPrivileges(role) && (
                    <>
                                <li style={styles.menuDivider} />
                                <li style={styles.menuItem} onMouseDown={() => handleEdit(doc)}>
                                  <span style={styles.menuIcon}><Pencil /></span>
                                  <span style={styles.menuLabel}>Edit</span>
                                </li>
                                <li style={{...styles.menuItem, color: '#dc2626'}} onClick={() => handleSoftDelete(doc)}>
                                  <span style={{...styles.menuIcon, color: '#dc2626'}}><Trash2 /></span>
                                  <span style={styles.menuLabel}>Move to Trash</span>
                                </li>
                    </>
                  )}
                          </ul>
                        </div>
                      )}
                    </div>
                </div>
              </div>
              
                                      <div style={styles.gridCardTitle}>{doc.title || 'Untitled'}</div>
                        
                        <div style={styles.gridCardMeta}>
                          {doc.created_by_profile_pic ? (
                            <img src={doc.created_by_profile_pic} alt="avatar" style={styles.gridCardAvatar} />
                          ) : (
                            <div style={{...styles.gridCardAvatar, background: getColorFromString(doc.created_by_name)}}>
                              {getInitials(doc.created_by_name)}
                            </div>
                          )}
                          <span>{doc.created_by_name || 'Unknown'}</span>
                        </div>
                        
                        <div style={styles.gridCardImage}>
                {doc.google_drive_link ? (
                  <iframe
                    src={doc.google_drive_link.replace('/view', '/preview')}
                    style={styles.documentPreview}
                    title={`Preview of ${doc.title}`}
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#9ca3af' }}>
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                      <path d="M14 14h-4v-4h4v4zm-2-2v-2h-2v2h2z"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                    </svg>
                    <span style={styles.imageText}>No Preview Available</span>
                  </div>
                )}
              </div>
              
                                      <div style={styles.gridCardDetails}>
                          {renderVisibilityTag(doc)}
                          {doc.from_field && (
                                                          <span style={{
                                ...styles.gridCardTag, 
                                background: '#3b82f6',
                                fontSize: '12px',
                                padding: '4px 8px'
                              }}>
                                From: {doc.from_field}
                              </span>
                          )}
                          {doc.to_field && (
                                                          <span style={{
                                ...styles.gridCardTag, 
                                background: '#10b981',
                                fontSize: '12px',
                                padding: '4px 8px'
                              }}>
                                To: {doc.to_field}
                              </span>
                          )}
                          {doc.doc_type && (
                                                          <span style={{
                                ...styles.gridCardTag, 
                                background: '#8b5cf6',
                                fontSize: '12px',
                                padding: '4px 8px'
                              }}>
                                {doc.doc_type}
                              </span>
                          )}
                                                      <span style={{
                              ...styles.gridCardTag, 
                              background: '#6b7280',
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}>
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                      </div>
          ))}
        </div>
        </>
      )}

      {viewMode === 'list' && (
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 8, gap: 8 }}>
          <div 
            style={{
              ...styles.checkbox,
              ...(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 ? styles.checkboxChecked : {})
            }}
            onClick={() => handleSelectAll(selectedDocuments.length !== filteredDocuments.length)}
            title={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 ? 'Deselect all' : 'Select all'}
          >
            {(selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
          <span style={{ color: '#374151', fontSize: 12 }}>Select All</span>
        </div>
        <div style={styles.listContainer}>
          {paginatedDocuments.map((doc) => (
            <div key={doc.id} style={styles.listItem}>
              <div style={styles.listItemLeft}>
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                />
                
                {doc.created_by_profile_pic ? (
                  <img src={doc.created_by_profile_pic} alt="avatar" style={styles.listItemAvatar} />
                ) : (
                  <div style={{...styles.listItemAvatar, background: getColorFromString(doc.created_by_name)}}>
                    {getInitials(doc.created_by_name)}
                  </div>
                )}
                
                <div style={styles.listItemInfo}>
                  <div style={styles.listItemTitle}>{doc.title || 'Untitled'}</div>
                  <div style={styles.listItemMeta}>
                    {doc.created_by_name || 'Unknown'} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                    {doc.reference && ` • ${doc.reference}`}
                    {' '}
                    <span style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                      {renderVisibilityTag(doc)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={styles.listItemRight}>
                <button 
                  className="btn btn-light btn-sm border rounded-circle" 
                  onClick={() => handleToggleFavorite(doc.id || doc.doc_id)} 
                  title={userPreferences[doc.id || doc.doc_id]?.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  style={{ color: userPreferences[doc.id || doc.doc_id]?.is_favorite ? '#fbbf24' : '#6b7280' }}
                >
                  <Star />
                </button>
                <button 
                  className="btn btn-light btn-sm border rounded-circle" 
                  onClick={() => handleTogglePin(doc.id || doc.doc_id)} 
                  title={userPreferences[doc.id || doc.doc_id]?.is_pinned ? "Unpin" : "Pin"}
                  style={{ color: userPreferences[doc.id || doc.doc_id]?.is_pinned ? '#f59e0b' : '#6b7280' }}
                >
                  <Pin />
                </button>
                  {/* 3-dot dropdown menu */}
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    <button 
                      className="btn btn-light btn-sm border rounded-circle" 
                      onClick={() => toggleDropdown(doc.id)} 
                      title="More actions"
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ThreeDotsVertical size={14} />
                    </button>
                    {openDropdown === doc.id && (
                      <div style={styles.dropdown}>
                        <ul style={styles.menuList}>
                          <li style={styles.menuItem} onClick={() => handleView(doc)}>
                            <span style={styles.menuIcon}><Eye /></span>
                            <span style={styles.menuLabel}>Open</span>
                          </li>
                          <li style={styles.menuItem} onClick={() => handleDownload(doc)}>
                            <span style={styles.menuIcon}><Download /></span>
                            <span style={styles.menuLabel}>Download</span>
                          </li>
                          <li style={styles.menuItem} onClick={() => handleSaveToDrive(doc)}>
                            <span style={styles.menuIcon}><Download /></span>
                            <span style={styles.menuLabel}>Save to Drive</span>
                          </li>
                          <li style={styles.menuDivider} />
                          <li style={styles.menuItem} onClick={() => openProperties(doc)}>
                            <span style={styles.menuIcon}><InfoCircle /></span>
                            <span style={styles.menuLabel}>Properties</span>
                          </li>
                {hasAdminPrivileges(role) && (
                  <>
                              <li style={styles.menuDivider} />
                              <li style={styles.menuItem} onMouseDown={() => handleEdit(doc)}>
                                <span style={styles.menuIcon}><Pencil /></span>
                                <span style={styles.menuLabel}>Edit</span>
                              </li>
                              <li style={{...styles.menuItem, color: '#dc2626'}} onClick={() => handleSoftDelete(doc)}>
                                <span style={{...styles.menuIcon, color: '#dc2626'}}><Trash2 /></span>
                                <span style={styles.menuLabel}>Move to Trash</span>
                              </li>
                  </>
                )}
                        </ul>
                      </div>
                    )}
                  </div>
              </div>
                </div>
           ))}
        </div>
        </>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <div>No documents found</div>
      )}

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div style={{
          ...styles.paginationContainer,
          ...(isMobile ? {
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'stretch'
          } : {})
        }}>
          {/* Dean/Admin/User Department Info */}
          {/* Removed filter info banner */}
          
          <div style={{
            ...styles.paginationInfo,
            ...(isMobile ? {
              textAlign: 'center',
              fontSize: '14px'
            } : {})
          }}>
            Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} documents ({filteredDocuments.length} total)
          </div>
          <div style={{
            ...styles.paginationControls,
            ...(isMobile ? {
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            } : {})
          }}>
            <button
              style={{
                ...(currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton),
                ...(isMobile ? {
                  minWidth: '36px',
                  minHeight: '36px',
                  fontSize: '14px'
                } : {})
              }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              ««
            </button>
            <button
              style={{
                ...(currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton),
                ...(isMobile ? {
                  minWidth: '36px',
                  minHeight: '36px',
                  fontSize: '14px'
                } : {})
              }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              title="Previous Page"
            >
              «
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === pageNum ? styles.paginationButtonActive : {}),
                    ...(isMobile ? {
                      minWidth: '44px',
                      minHeight: '44px',
                      fontSize: '16px'
                    } : {})
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              style={{
                ...(currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton),
                ...(isMobile ? {
                  minWidth: '36px',
                  minHeight: '36px',
                  fontSize: '14px'
                } : {})
              }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              »
            </button>
            <button
              style={{
                ...(currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton),
                ...(isMobile ? {
                  minWidth: '36px',
                  minHeight: '36px',
                  fontSize: '14px'
                } : {})
              }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              »»
            </button>
          </div>
        </div>
      )}
      {previewOpen && previewDoc && (
        <div style={styles.modalBackdrop} onClick={closePreview}>
          <div style={{
            ...styles.modal,
            ...(isMobile ? {
              width: '95%',
              height: '90%',
              maxWidth: 'none',
              maxHeight: 'none',
              margin: '5% auto'
            } : {})
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              ...styles.modalHeader,
              ...(isMobile ? {
                padding: '16px',
                fontSize: '18px'
              } : {})
            }}>
              <div style={{ fontWeight: '600' }}>{previewDoc.title || 'Document'}</div>
              <button onClick={closePreview} style={{
                ...styles.modalCloseBtn,
                ...(isMobile ? {
                  minWidth: '44px',
                  minHeight: '44px',
                  fontSize: '20px'
                } : {})
              }}>✕</button>
          </div>
            <div style={{
              ...styles.modalBody,
              ...(isMobile ? {
                padding: '16px',
                height: 'calc(100% - 80px)'
              } : {})
            }}>
              {getDrivePreviewUrl(previewDoc.google_drive_link) ? (
            <iframe
              src={getDrivePreviewUrl(previewDoc.google_drive_link)}
                  title="Drive Preview"
                  style={{ 
                    width: '100%', 
                    height: isMobile ? '100%' : '60vh', 
                    border: '1px solid #ddd', 
                    borderRadius: 6 
                  }}
              allow="autoplay"
            />
              ) : (
                <div style={{ color: '#666' }}>No embeddable preview available.</div>
                    )}
              </div>
            </div>
          </div>
        )}



        {/* Mass Delete Warning Modal */}
        {massDeleteWarningOpen && (
          <div style={styles.modalBackdrop} onClick={cancelMassDelete}>
            <div style={{
              ...styles.warningModal,
              ...(isMobile ? {
                width: '90%',
                maxWidth: 'none',
                margin: '10% auto'
              } : {})
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                ...styles.warningModalHeader,
                ...(isMobile ? {
                  padding: '16px',
                  fontSize: '18px'
                } : {})
              }}>
                <div style={styles.warningModalTitle}>
                  <span style={styles.warningIcon}>⚠️</span>
                  Move Documents to Trash
                </div>
                <button onClick={cancelMassDelete} style={{
                  ...styles.editModalCloseBtn,
                  color: '#dc2626',
                  '&:hover': {
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626'
                  },
                  ...(isMobile ? {
                    minWidth: '44px',
                    minHeight: '44px'
                  } : {})
                }}>
                  <XCircle />
                </button>
              </div>
              <div style={styles.warningModalBody}>
                <div style={styles.warningContent}>
                  <div style={styles.warningMessage}>
                    Are you sure you want to move {selectedDocuments.length} selected document(s) to the trash? This action can be undone later.
                  </div>
                  
                  <div style={styles.warningMessage}>
                    <strong>What happens next:</strong>
                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                      <li>All selected documents will be moved to the trash</li>
                      <li>They will no longer appear in the active documents list</li>
                      <li>You can restore them later from the trash</li>
                      <li>The documents and their data will be preserved</li>
                    </ul>
                  </div>
                </div>
                
                <div style={styles.warningActions}>
                  <button 
                    onClick={cancelMassDelete} 
                    className="btn btn-light rounded-pill px-4"
                    style={styles.cancelButton}
                  >
                    <XCircle style={{ marginRight: '6px' }} />
                    Cancel
                  </button>
                  <button 
                    onClick={confirmMassDelete} 
                    className="btn btn-danger rounded-pill px-4"
                    style={styles.deleteButton}
                  >
                    <Trash2 style={{ marginRight: '6px' }} />
                    Move to Trash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Edit Document Modal */}
      {editOpen && editDoc && (
        <div style={styles.modalBackdrop} onClick={closeEdit}>
          <div style={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div style={{
              ...styles.editModalHeader,
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                ...styles.editModalTitle,
                color: '#1f2937',
                fontSize: '18px'
              }}>
                <Pencil style={{ marginRight: '12px', color: '#6b7280' }} />
                Edit Document
              </div>
              <button onClick={closeEdit} style={{
                ...styles.editModalCloseBtn,
                color: '#6b7280',
                '&:hover': {
                  background: '#f3f4f6',
                  color: '#374151'
                }
              }}>
                <XCircle />
              </button>
            </div>
            <div style={styles.editModalBody}>
              <div style={styles.editForm}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>Basic Information</div>
                  <div style={styles.formGrid}>
                    <div style={styles.floatingLabelContainer}>
                      <input
                        type="text"
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('title')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        placeholder=" "
                        required
                        id="editTitle"
                      />
                      <label 
                        htmlFor="editTitle"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'title' ? styles.floatingLabelFocused : 
                              editForm.title ? styles.floatingLabelFilled : {})
                        }}
                      >
                        Title<span style={styles.required}>*</span>
                      </label>
                    </div>
                    
                    <div style={styles.floatingLabelContainer}>
                      <input
                        type="text"
                        name="reference"
                        value={editForm.reference}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('reference')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        placeholder=" "
                        id="editReference"
                      />
                      <label 
                        htmlFor="editReference"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'reference' ? styles.floatingLabelFocused : 
                              editForm.reference ? styles.floatingLabelFilled : {})
                        }}
                      >
                        Reference
                      </label>
                    </div>
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>Contact Information</div>
                  <div style={styles.formGrid}>
                    <div style={styles.floatingLabelContainer}>
                      <input
                        type="text"
                        name="from_field"
                        value={editForm.from_field}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('from_field')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        placeholder=" "
                        id="editFromField"
                      />
                      <label 
                        htmlFor="editFromField"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'from_field' ? styles.floatingLabelFocused : 
                              editForm.from_field ? styles.floatingLabelFilled : {})
                        }}
                      >
                        From (Sender)
                      </label>
                    </div>
                    
                    <div style={styles.floatingLabelContainer}>
                      <input
                        type="text"
                        name="to_field"
                        value={editForm.to_field}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('to_field')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        placeholder=" "
                        id="editToField"
                      />
                      <label 
                        htmlFor="editToField"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'to_field' ? styles.floatingLabelFocused : 
                              editForm.to_field ? styles.floatingLabelFilled : {})
                        }}
                      >
                        To (Recipient)
                      </label>
                    </div>
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>Document Details</div>
                  <div style={styles.formGrid}>
                    <div style={styles.floatingLabelContainer}>
                      <input
                        type="date"
                        name="date_received"
                        value={editForm.date_received}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('date_received')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        id="editDateReceived"
                      />
                      <label 
                        htmlFor="editDateReceived"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'date_received' ? styles.floatingLabelFocused : 
                              editForm.date_received ? styles.floatingLabelFilled : {})
                        }}
                      >
                        Date Received
                      </label>
                    </div>
                    
                    <div style={styles.floatingLabelContainer}>
                      <select
                        name="doc_type"
                        value={editForm.doc_type}
                        onChange={handleEditChange}
                        onFocus={() => handleEditFocus('doc_type')}
                        onBlur={handleEditBlur}
                        style={styles.floatingInput}
                        id="editDocType"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <label 
                        htmlFor="editDocType"
                        style={{
                          ...styles.floatingLabel,
                          ...(editFocusedField === 'doc_type' ? styles.floatingLabelFocused : 
                              editForm.doc_type ? styles.floatingLabelFilled : {})
                        }}
                      >
                        Category
                      </label>
                    </div>
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>Description</div>
                  <div style={styles.floatingLabelContainer}>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      onFocus={() => handleEditFocus('description')}
                      onBlur={handleEditBlur}
                      style={styles.floatingTextarea}
                      placeholder=" "
                      rows="4"
                      id="editDescription"
                    />
                    <label 
                      htmlFor="editDescription"
                      style={{
                        ...styles.floatingLabel,
                        ...(editFocusedField === 'description' ? styles.floatingLabelFocused : 
                            editForm.description ? styles.floatingLabelFilled : {})
                      }}
                    >
                      Document Description
                    </label>
                  </div>
                </div>
                
                    <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>Visibility</div>
                  <div style={styles.formGrid}>
                      <div style={styles.floatingLabelContainer}>
                      <div style={{ position: 'relative' }}>
                        <select
                          name="visibility_mode"
                          value={editVisibilityMode}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setEditVisibilityMode(mode);
                            if (mode === 'all') {
                              setEditSelectedDepartments((departmentsList || []).map(d => Number(d.department_id || d.value)).filter(Boolean));
                            } else if (mode === 'specific') {
                              setEditSelectedDepartments([]);
                            }
                          }}
                          style={styles.floatingInput}
                          id="editVisibilityMode"
                        >
                          <option value="all">All Departments</option>
                          <option value="specific">Specific Departments</option>
                        </select>
                      </div>
                        <label 
                        htmlFor="editVisibilityMode"
                          style={{
                            ...styles.floatingLabel,
                          ...(true ? styles.floatingLabelFilled : {})
                          }}
                        >
                        Visibility Mode
                        </label>
                    </div>
                      </div>
                      
                  {editVisibilityMode === 'specific' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: 8 }}>Select Departments</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {departmentsLoading && <span>Loading departments...</span>}
                        {!departmentsLoading && (departmentsList || []).map(d => {
                          const id = Number(d.department_id || d.value);
                          const label = d.code || d.name;
                          const selected = editSelectedDepartments.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setEditSelectedDepartments(prev => prev.includes(id)
                                  ? prev.filter(v => v !== id)
                                  : [...prev, id]
                                );
                              }}
                              className="btn"
                          style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 20,
                                padding: '6px 12px',
                                background: selected ? '#111827' : '#fff',
                                color: selected ? '#fff' : '#374151',
                                fontSize: 12
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specific Users */}
                  {editVisibilityMode === 'users' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: 8 }}>Select Users</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {usersLoading && <span>Loading users...</span>}
                        {!usersLoading && usersList.map(u => {
                          const selected = editSelectedUsers.includes(u.user_id);
                          return (
                            <button
                              key={u.user_id}
                              type="button"
                              onClick={() => {
                                setEditSelectedUsers(prev => prev.includes(u.user_id)
                                  ? prev.filter(id => id !== u.user_id)
                                  : [...prev, u.user_id]
                                );
                              }}
                              className="btn"
                          style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 20,
                                padding: '6px 12px',
                                background: selected ? '#111827' : '#fff',
                                color: selected ? '#fff' : '#374151',
                                fontSize: 12
                              }}
                            >
                              {u.full_name} ({u.role})
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                  {/* Specific Roles */}
                  {editVisibilityMode === 'roles' && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: 8 }}>Select Roles</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['ADMIN','DEAN','FACULTY'].map(r => {
                          const selected = editSelectedRoles.includes(r);
                          return (
                            <button 
                              key={r}
                              type="button"
                              onClick={() => {
                                setEditSelectedRoles(prev => prev.includes(r)
                                  ? prev.filter(x => x !== r)
                                  : [...prev, r]
                                );
                              }}
                              className="btn"
                              style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 20,
                                padding: '6px 12px',
                                background: selected ? '#111827' : '#fff',
                                color: selected ? '#fff' : '#374151',
                                fontSize: 12
                              }}
                            >
                              {r}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
                </div>
                
                <div style={styles.formActions}>
                      <button 
                    onClick={closeEdit} 
                        className="btn btn-light rounded-pill px-4"
                        style={styles.cancelBtn}
                      >
                        <XCircle style={{ marginRight: '6px' }} />
                        Cancel
                      </button>
                      <button 
                    onClick={saveEdit} 
                        className="btn btn-primary rounded-pill px-4"
                        style={styles.saveBtn}
                    disabled={isSaving}
                      >
                    {isSaving ? (
                          <>
                            <div className="spinner-border spinner-border-sm" style={{ marginRight: '6px' }} role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                        Saving...
                          </>
                        ) : (
                          <>
                        <Pencil style={{ marginRight: '6px' }} />
                        Save Changes
                          </>
                        )}
                      </button>
                </div>
              </div>
                  </div>
                </div>
              </div>
      )}

     

      {/* Delete Warning Modal */}
      {deleteWarningOpen && documentToDelete && (
        <div style={styles.modalBackdrop} onClick={cancelDelete}>
          <div style={styles.warningModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.warningModalHeader}>
              <div style={styles.warningModalTitle}>
                <span style={styles.warningIcon}>⚠️</span>
                Move Document to Trash
              </div>
              <button onClick={cancelDelete} style={{
                ...styles.editModalCloseBtn,
                color: '#dc2626',
                '&:hover': {
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626'
                }
              }}>
                <XCircle />
              </button>
            </div>
            <div style={styles.warningModalBody}>
              <div style={styles.warningContent}>
                <div style={styles.warningMessage}>
                  Are you sure you want to move this document to the trash? This action can be undone later.
                </div>
                
                <div style={styles.documentInfo}>
                  <div style={styles.documentInfoItem}>
                    <span style={styles.documentInfoLabel}>Document Title:</span>
                    <span style={styles.documentInfoValue}>{documentToDelete.title || 'Untitled'}</span>
                  </div>
                  <div style={styles.documentInfoItem}>
                    <span style={styles.documentInfoLabel}>Reference:</span>
                    <span style={styles.documentInfoValue}>{documentToDelete.reference || 'N/A'}</span>
                  </div>
                  <div style={styles.documentInfoItem}>
                    <span style={styles.documentInfoLabel}>Created By:</span>
                    <span style={styles.documentInfoValue}>{documentToDelete.created_by_name || 'Unknown'}</span>
                  </div>
                  <div style={styles.documentInfoItem}>
                    <span style={styles.documentInfoLabel}>Date Created:</span>
                    <span style={styles.documentInfoValue}>
                      {documentToDelete.created_at ? new Date(documentToDelete.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.warningMessage}>
                  <strong>What happens next:</strong>
                  <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    <li>The document will be moved to the trash</li>
                    <li>It will no longer appear in the active documents list</li>
                    <li>You can restore it later from the trash</li>
                    <li>The document and its data will be preserved</li>
                  </ul>
                </div>
              </div>
              
              <div style={styles.warningActions}>
                <button 
                  onClick={cancelDelete} 
                  className="btn btn-light rounded-pill px-4"
                  style={styles.cancelButton}
                >
                  <XCircle style={{ marginRight: '6px' }} />
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="btn btn-danger rounded-pill px-4"
                  style={styles.deleteButton}
                >
                  <Trash2 style={{ marginRight: '6px' }} />
                  Move to Trash
                </button>
              </div>
                  </div>
                </div>
              </div>
      )}

      {/* Properties Modal */}
      {propertiesOpen && propertiesDoc && (
        <div style={styles.modalBackdrop} onClick={closeProperties}>
          <div style={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div style={{
              ...styles.editModalHeader,
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                ...styles.editModalTitle,
                color: '#1f2937',
                fontSize: '18px'
              }}>
                <span style={{ marginRight: '8px' }}>📄</span>
                Document Details
              </div>
              <button onClick={closeProperties} style={{
                ...styles.editModalCloseBtn,
                color: '#6b7280',
                '&:hover': {
                  background: '#f3f4f6',
                  color: '#374151'
                }
              }}>
                <XCircle />
              </button>
            </div>
            <div style={styles.editModalBody}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📋</span>
                  Document Information
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {Object.entries(propertiesDoc)
                  .filter(([key]) => !['visible_to_all','created_by_profile_pic','department_ids'].includes(key))
                  .map(([key, value]) => (
                  <div key={key} style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                      {formatFieldName(key)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827', wordBreak: 'break-word' }}>
                      {(() => {
                        if (value === null || value === undefined) return '-';
                        if (typeof value === 'object') {
                          // Handle date objects or date strings
                          if (value instanceof Date) {
                            return value.toLocaleDateString() + ' at ' + value.toLocaleTimeString();
                          }
                          // Handle date strings
                          if (typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
                            try {
                              const date = new Date(value);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
                              }
                            } catch (e) {
                              // If date parsing fails, return the original string
                            }
                          }
                          return JSON.stringify(value);
                        }
                        // Handle date strings that aren't objects
                        if (typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
                          try {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
                            }
                          } catch (e) {
                            // If date parsing fails, return the original string
                          }
                        }
                        return String(value);
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visibility Breakdown */}
              <div style={{
                marginTop: '16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#374151' }}>Visibility</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Visible To All</div>
                    <div>{isPublic(propertiesDoc) ? 'Yes' : 'No'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Departments</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(() => {
                        const depts = (propertiesDoc.department_names || '').split(',').map(s => s.trim()).filter(Boolean);
                        if (depts.length === 0) return <span style={{ color: '#6b7280' }}>—</span>;
                        return depts.map((d, idx) => (
                          <span key={idx} style={{ background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 9999, fontSize: 12 }}>{d}</span>
                        ));
                      })()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Roles</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(() => {
                        const roles = parseList(propertiesDoc.allowed_roles, true);
                        if (roles.length === 0) return <span style={{ color: '#6b7280' }}>—</span>;
                        const max = 6;
                        const head = roles.slice(0, max);
                        const extra = roles.length - head.length;
                        return (
                          <>
                            {head.map((r, idx) => (
                              <span key={idx} style={{ background: '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 9999, fontSize: 12 }}>{r.toUpperCase()}</span>
                            ))}
                            {extra > 0 && (
                              <span style={{ color: '#6b7280', fontWeight: 700 }}>+{extra} more</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Users</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(() => {
                        const users = parseList(propertiesDoc.allowed_user_ids || propertiesDoc.user_ids);
                        if (users.length === 0) return <span style={{ color: '#6b7280' }}>—</span>;
                        const max = 6;
                        const head = users.slice(0, max);
                        const extra = users.length - head.length;
                        return (
                          <>
                            {head.map((u, idx) => (
                              <span key={idx} style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 9999, fontSize: 12 }}>User #{u}</span>
                            ))}
                            {extra > 0 && (
                              <span style={{ color: '#059669', fontWeight: 700 }}>+{extra} more</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={closeProperties}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (propertiesDoc.google_drive_link) {
                      window.open(propertiesDoc.google_drive_link, '_blank');
                    }
                  }}
                  disabled={!propertiesDoc.google_drive_link}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #3b82f6',
                    backgroundColor: propertiesDoc.google_drive_link ? '#3b82f6' : '#f3f4f6',
                    color: propertiesDoc.google_drive_link ? '#fff' : '#9ca3af',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: propertiesDoc.google_drive_link ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (propertiesDoc.google_drive_link) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (propertiesDoc.google_drive_link) {
                      e.target.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  View Full Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Basic styles
const styles = {
  container: {
    padding: '20px',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '20px',
  },
  leftControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  viewOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  viewLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  viewButtons: {
    display: 'flex',
    gap: '8px',
  },
  
  searchInput: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '20px',
    fontSize: '14px',
    width: '300px',
    backgroundColor: '#fff',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  
  
  filterPopover: {
    position: 'absolute',
    marginTop: '42px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    zIndex: 1200,
    minWidth: '300px'
  },
  
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
    background: 'transparent',
  },
  
  sortableHeader: {
    cursor: 'pointer',
    userSelect: 'none',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
  },
  
  th: {
    padding: '20px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: '600',
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6',
  },
  
  td: {
    padding: '18px 14px',
    border: 'none',
    textAlign: 'left',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#374151',
  },
  tableRow: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-1px)',
    }
  },
  tableRowFirstCell: {
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px',
  },
  tableRowLastCell: {
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  actionButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    color: '#6b7280',
    '&:hover': {
      background: '#f9fafb',
      borderColor: '#d1d5db',
      transform: 'translateY(-1px)',
    }
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      borderColor: '#3b82f6',
      background: '#f0f9ff',
    }
  },
  checkboxChecked: {
    borderColor: '#3b82f6',
    background: '#3b82f6',
    color: '#fff',
  },
  
  dropdown: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '6px',
    zIndex: 1000,
    minWidth: '220px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)'
  },
  menuList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#111827',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  menuIcon: {
    width: '16px',
    height: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280'
  },
  menuLabel: {
    flex: 1,
    fontSize: '13px',
    color: '#111827'
  },
  menuDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '4px 6px'
  },

  // Modal styles
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  modal: {
    background: '#fff',
    borderRadius: '8px',
    width: 'min(900px, 96vw)',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #eee'
  },
  modalCloseBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '2px 8px',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '12px 16px',
    background: '#fafafa'
  },
  
  // Edit modal styles
  editModal: {
    background: '#fff',
    borderRadius: '12px',
    width: 'min(800px, 90vw)',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb'
  },
  editModalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa'
  },
  editModalTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: '600',
    fontSize: '18px',
    color: '#1f2937'
  },
  editModalCloseBtn: {
    background: 'none',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f3f4f6',
      color: '#374151'
    }
  },
  editModalBody: {
    padding: '24px',
    maxHeight: 'calc(85vh - 80px)',
    overflowY: 'auto'
  },
  
  // Edit form styles
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: '16px',
    color: '#1f2937',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    background: '#fff',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    '&:hover': {
      borderColor: '#9ca3af'
    }
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    background: '#fff',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    '&:hover': {
      borderColor: '#9ca3af'
    }
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'all 0.2s',
    background: '#fff',
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    '&:hover': {
      borderColor: '#9ca3af'
    }
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '2px solid #e5e7eb'
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f9fafb',
      borderColor: '#9ca3af'
    }
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    background: '#3b82f6',
    border: '1px solid #3b82f6',
    color: '#fff',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#2563eb',
      borderColor: '#2563eb'
    }
  },
  
  // Revision modal styles
  revisionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px'
  },
  currentVersionSection: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  currentVersionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px'
  },
  versionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    wordBreak: 'break-all',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline',
      color: '#2563eb'
    }
  },
  newRevisionSection: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  versionHistorySection: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  versionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '8px'
  },
  versionCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    transition: 'all 0.3s ease',
    position: 'relative',
    '&:hover': {
      borderColor: '#d1d5db',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)'
    }
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9'
  },
  versionNumber: {
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
    background: '#f3f4f6',
    padding: '6px 16px',
    borderRadius: '25px',
    border: '1px solid #e5e7eb'
  },
  currentBadge: {
    background: '#f3f4f6',
    color: '#374151',
    padding: '6px 16px',
    borderRadius: '25px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #e5e7eb'
  },
  versionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #f3f4f6'
  },
  versionActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  
  // Floating label styles
  floatingLabelContainer: {
    position: 'relative',
    marginBottom: '20px'
  },
  floatingInput: {
    width: '100%',
    padding: '20px 16px 12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    transition: 'all 0.2s',
    background: '#fff',
    minHeight: '56px',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    '&:hover': {
      borderColor: '#9ca3af'
    }
  },
  floatingTextarea: {
    width: '100%',
    padding: '20px 16px 12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '120px',
    transition: 'all 0.2s',
    background: '#fff',
    fontFamily: 'inherit',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    '&:hover': {
      borderColor: '#9ca3af'
    }
  },
  floatingLabel: {
    position: 'absolute',
    left: '12px',
    top: '16px',
    fontSize: '14px',
    color: '#6b7280',
    transition: 'all 0.2s',
    pointerEvents: 'none',
    background: '#fff',
    padding: '0 4px'
  },
  floatingLabelFocused: {
    top: '6px',
    fontSize: '12px',
    color: '#3b82f6',
    fontWeight: '500'
  },
  floatingLabelFilled: {
    top: '6px',
    fontSize: '12px',
    color: '#374151',
    fontWeight: '500'
  },
  required: {
    color: '#ef4444',
    marginLeft: '2px',
    fontWeight: '600'
  },
  
  // Warning modal styles
  warningModal: {
    background: '#fff',
    borderRadius: '16px',
    width: 'min(500px, 90vw)',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb'
  },
  warningModalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fef2f2',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px'
  },
  warningModalTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: '600',
    fontSize: '18px',
    color: '#dc2626'
  },
  warningModalBody: {
    padding: '24px',
    background: '#fff'
  },
  warningIcon: {
    fontSize: '24px',
    marginRight: '12px',
    color: '#dc2626'
  },
  warningContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  warningMessage: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.5'
  },
  documentInfo: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  documentInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  documentInfoLabel: {
    fontWeight: '600',
    color: '#374151'
  },
  documentInfoValue: {
    color: '#6b7280'
  },
  warningActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f9fafb',
      borderColor: '#9ca3af'
    }
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    background: '#dc2626',
    border: '1px solid #dc2626',
    color: '#fff',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#b91c1c',
      borderColor: '#b91c1c'
    }
  },
  
  // Grid and List view styles
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    padding: '20px 0',
  },
  gridCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    '&:hover': {
      borderColor: '#3b82f6',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
      transform: 'translateY(-2px)'
    }
  },
  gridCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  gridCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  gridCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '12px',
    color: '#6b7280',
  },
  gridCardAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
    color: '#1f2937',
  },
  gridCardTags: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
  },
  gridCardTag: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
    color: '#fff',
  },
  gridCardActions: {
    display: 'flex',
    gap: '2px',
    justifyContent: 'flex-end',
  },
  gridCardDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '12px',
    gap: '4px',
  },
  gridCardDetailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  gridCardDetailLabel: {
    fontWeight: '600',
    color: '#374151',
    minWidth: '40px',
  },
  gridCardDetailValue: {
    color: '#6b7280',
    textAlign: 'right',
    flex: 1,
    marginLeft: '8px',
  },
  gridCardImage: {
    marginBottom: '12px',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: '#f8fafc',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  imageText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },

  // Mobile styles
  mobileCardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '0',
  },
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  mobileDocInfo: {
    flex: 1,
    marginRight: '12px',
  },
  mobileDocTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    cursor: 'pointer',
    lineHeight: '1.4',
    '&:hover': {
      color: '#3b82f6',
    }
  },
  mobileDocType: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  mobileCardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileCardBody: {
    marginBottom: '16px',
  },
  mobileInfoRow: {
    marginBottom: '12px',
  },
  mobileCreatedBy: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  mobileAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    objectFit: 'cover',
  },
  mobileCreatedByName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '2px',
  },
  myDocBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '10px',
    fontWeight: '600',
  },
  mobileDateInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
  },
  mobileDateItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mobileDateLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  mobileCardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  mobileActionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mobileActionBtn: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#d1d5db',
      transform: 'translateY(-1px)',
    }
  },
  documentPreview: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '8px',
    background: '#fff',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px 0',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#3b82f6',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
    }
  },
  listItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  listItemAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  listItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  listItemTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  listItemMeta: {
    fontSize: '12px',
    color: '#6b7280',
  },
  listItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  
  // Pagination styles
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    borderTop: '1px solid #e5e7eb',
    marginTop: '20px',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  paginationButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
    padding: '0 12px',
    border: '1px solid #d1d5db',
    borderRadius: '18px',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#f9fafb',
      borderColor: '#9ca3af',
    }
  },
  paginationButtonActive: {
    background: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#fff',
    '&:hover': {
      background: '#2563eb',
      borderColor: '#2563eb',
    }
  },
  paginationButtonDisabled: {
    background: '#f9fafb',
    borderColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: '#6b7280',
    fontWeight: '600'
  },
};

// Add CSS animation for success message
export default Document; 