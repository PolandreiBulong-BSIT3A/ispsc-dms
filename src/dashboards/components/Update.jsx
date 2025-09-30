import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext.jsx';
import { fetchWithRetry } from '../../lib/api/frontend/http.js';
import { FiLink, FiX, FiCheck, FiAlertCircle, FiExternalLink, FiMaximize2, FiPlus, FiChevronDown } from 'react-icons/fi';
import { useDocuments } from '../../contexts/DocumentContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

const Update = ({ role, onNavigateToDocuments, id }) => {
  const [editingId, setEditingId] = useState(id);
  const [prefillLoading, setPrefillLoading] = useState(false);
  // Responsive state for layout tweaks (must be before resize effect below)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!id) return;
    setPrefillLoading(true);
    fetchWithRetry(`http://localhost:5000/api/documents/${id}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        if (!data?.success || !data?.document) return;
        const d = data.document;
        setLinkTitle(d.title || '');
        setDocReference(d.reference || '');
        setFromField(d.from_field || '');
        setToField(d.to_field || '');
        setDateTimeReceived(d.date_received ? String(d.date_received).slice(0,10) : '');
        setDocType(d.doc_type || '');
        setSelectedFolder(d.folder || '');
        // Prefill multi-folder IDs if provided by backend
        if (d.folder_ids) {
          const ids = String(d.folder_ids)
            .split(',')
            .map(s => Number(String(s).trim()))
            .filter(Boolean);
          setSelectedFolderIds(ids);
        }
        setDescription(d.description || '');
        setAvailableCopy(d.available_copy || 'soft_copy');
        setRevision(d.revision || '');
        setRevisionDate(d.rev_date ? String(d.rev_date).slice(0,10) : '');
        setMultipleLinks([{ id: 1, link: d.google_drive_link || '' }]);
      })
      .finally(() => setPrefillLoading(false));
  }, [id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { addDocument, updateDocument } = useDocuments();
  const { user: currentUser } = useUser();
  const { refreshNotificationsImmediately } = useNotifications();
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [multipleLinks, setMultipleLinks] = useState([{ id: 1, link: '' }]);
  const [linkTitle, setLinkTitle] = useState('');
  const [selectedPreviewLink, setSelectedPreviewLink] = useState(0);
  const [docReference, setDocReference] = useState('');
  const [fromField, setFromField] = useState('');
  const [toField, setToField] = useState('');
  const [fromHistory, setFromHistory] = useState([]); // recent "From" entries
  const [toHistory, setToHistory] = useState([]);     // recent "To" entries
  const [fromOpen, setFromOpen] = useState(false);    // combobox open state
  const [toOpen, setToOpen] = useState(false);        // combobox open state
  const [dateTimeReceived, setDateTimeReceived] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState([]);
  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [addBtnHover, setAddBtnHover] = useState(false);
  const [revision, setRevision] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [docType, setDocType] = useState('');
  const [description, setDescription] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const defaultActionOptions = [];
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [showAddDocTypeModal, setShowAddDocTypeModal] = useState(false);
  const [newDocTypeName, setNewDocTypeName] = useState('');
  const [addingDocType, setAddingDocType] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(''); // Legacy single folder select
  const [folders, setFolders] = useState([]);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  // Multi-folder UI state
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [visibilityMode, setVisibilityMode] = useState(''); // 'all', 'specific', 'users', 'roles', 'role_dept'
  const [users, setUsers] = useState([]); // { user_id, firstname, lastname, role, department_id, department_name }
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedRoleDept, setSelectedRoleDept] = useState({ role: '', department: '' });
  const [userFilterDept, setUserFilterDept] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('');
  // Users dropdown controls
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  // Departments dropdown controls (for 'specific' visibility)
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  // Roles dropdown controls (for 'roles' visibility)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  // Action Required (frontend-only support)
  const [actionOptions, setActionOptions] = useState([]); // [{id, name}]
  const [actionsLoading, setActionsLoading] = useState(false);
  const [selectedActions, setSelectedActions] = useState([]); // [ids]
  const [requireAction, setRequireAction] = useState(false);
  const [isPrefilledFromAnswered, setIsPrefilledFromAnswered] = useState(false);
  const [availableCopy, setAvailableCopy] = useState('soft_copy'); // 'soft_copy', 'hard_copy', 'both'

  // Validate Google Drive link
  const isValidDriveLink = (link) => {
    const drivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view/,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\/edit/,
      /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\/edit/
    ];
    return drivePatterns.some(pattern => pattern.test(link));
  };

  // Fetch document types
  const fetchDocumentTypes = async () => {
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/document-types', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocumentTypes(data.documentTypes || []);
        }
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/folders', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFolders(data.folders || []);
        }
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await fetchWithRetry('http://localhost:5000/api/departments', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.departments)
            ? data.departments
            : [];
        // Normalize field names
        let normalized = list.map(d => ({
          department_id: d.department_id ?? d.id ?? d.departmentId ?? d.value,
          name: d.name ?? d.department_name ?? d.label ?? d.code,
          code: (d.code ?? d.department_code ?? d.abbr)?.toString().toUpperCase()
        })).filter(d => d.department_id && d.name);
        // Sort by code if present, else by name
        normalized = normalized.sort((a, b) => {
          const aKey = (a.code || a.name || '').toString();
          const bKey = (b.code || b.name || '').toString();
          return aKey.localeCompare(bKey);
        });
        setDepartments(normalized);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetchWithRetry('http://localhost:5000/api/users', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
            ? data.users
            : [];
        // Normalize user data with department info
        let normalized = list.map(u => ({
          user_id: u.user_id ?? u.id ?? u.userId,
          firstname: u.firstname ?? u.first_name ?? u.firstName,
          lastname: u.lastname ?? u.last_name ?? u.lastName,
          role: u.role ?? u.user_role,
          department_id: u.department_id ?? u.dept_id,
          department_name: u.department_name ?? u.dept_name,
          email: u.user_email ?? u.email,
          full_name: `${(u.firstname ?? u.first_name ?? u.firstName) || ''} ${(u.lastname ?? u.last_name ?? u.lastName) || ''}`.trim()
        })).filter(u => u.user_id && u.firstname && u.lastname);
        
        // Sort by name
        normalized = normalized.sort((a, b) => a.full_name.localeCompare(b.full_name));
        setUsers(normalized);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch action_required (frontend-only: fallback to defaults if API missing)
  const fetchActionRequired = async () => {
    try {
      setActionsLoading(true);
      const response = await fetchWithRetry('http://localhost:5000/api/action-required', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.actions)
            ? data.actions
            : [];
        const normalized = list.map(a => ({
          id: a.id ?? a.action_id ?? a.value,
          name: a.name ?? a.action_name ?? a.label,
        })).filter(a => a.id && a.name);
        if (normalized.length > 0) {
          setActionOptions(normalized);
        } else {
          setActionOptions(defaultActionOptions);
        }
      } else {
        setActionOptions(defaultActionOptions);
      }
    } catch (error) {
      console.warn('Action Required API not available, using defaults.');
      setActionOptions(defaultActionOptions);
    } finally {
      setActionsLoading(false);
    }
  };

  // Fetch document types and departments on mount and when role becomes available
  useEffect(() => {
    fetchDocumentTypes();
    fetchFolders();
    fetchDepartments();
    fetchUsers();
    fetchActionRequired();
    
    // Check if we should pre-fill form from answered document
    const createFromAnswered = sessionStorage.getItem('createFromAnswered');
    console.log('Upload component - sessionStorage createFromAnswered:', createFromAnswered);
    
    if (createFromAnswered) {
      try {
        const data = JSON.parse(createFromAnswered);
        console.log('Upload component - parsed data:', data);
        
        // Pre-fill the form fields
        if (data.title) {
          console.log('Setting title:', data.title);
          setLinkTitle(data.title);
        }
        if (data.reference) {
          console.log('Setting reference:', data.reference);
          setDocReference(data.reference);
        }
        if (data.category) {
          console.log('Setting category:', data.category);
          setDocType(data.category);
        }
        if (data.from) {
          console.log('Setting from:', data.from);
          setFromField(data.from);
        }
        if (data.to) {
          console.log('Setting to:', data.to);
          setToField(data.to);
        }
        if (data.dateTimeReceived) {
          console.log('Setting dateTimeReceived:', data.dateTimeReceived);
          setDateTimeReceived(data.dateTimeReceived);
        }
        if (data.description) {
          console.log('Setting description:', data.description);
          setDescription(data.description);
        }
        if (data.available_copy) {
          console.log('Setting available_copy:', data.available_copy);
          setAvailableCopy(data.available_copy);
        }
        
        // Handle Google Drive link prefill
        if (data.google_drive_link) {
          console.log('Setting google_drive_link:', data.google_drive_link);
          // Set the link in the first multiple link field
          setMultipleLinks([{ id: 1, link: data.google_drive_link }]);
          console.log('Google Drive link set in form field:', data.google_drive_link);
        } else {
          console.log('No Google Drive link found in prefill data');
        }
        
        // Set flag to show this was pre-filled
        setIsPrefilledFromAnswered(true);
        console.log('Form pre-filled successfully');
        
        // Clear the sessionStorage after pre-filling
        sessionStorage.removeItem('createFromAnswered');
        
        // Show success message
        setSuccessMessage('Form pre-filled from answered request! You can modify the details as needed.');
      } catch (error) {
        console.error('Error parsing createFromAnswered data:', error);
        sessionStorage.removeItem('createFromAnswered');
      }
    } else {
      console.log('No createFromAnswered data found in sessionStorage');
    }
  }, []);

  // Load From/To history from localStorage
  useEffect(() => {
    try {
      const fh = JSON.parse(localStorage.getItem('upload_from_history') || '[]');
      const th = JSON.parse(localStorage.getItem('upload_to_history') || '[]');
      if (Array.isArray(fh)) setFromHistory(fh);
      if (Array.isArray(th)) setToHistory(th);
    } catch (_) {
      // ignore parse errors
    }
  }, []);

  // One-time seed of history from previous documents (server-side)
  useEffect(() => {
    const seeded = localStorage.getItem('upload_history_seeded');
    if (seeded === 'true') return;
    (async () => {
      try {
        const resp = await fetchWithRetry('http://localhost:5000/api/documents/distinct-from-to?limit=200', {
          method: 'GET',
          credentials: 'include'
        });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        if (data && data.success) {
          const fromValues = Array.isArray(data.from_values) ? data.from_values : [];
          const toValues = Array.isArray(data.to_values) ? data.to_values : [];
          // Merge with existing local history
          const fh = JSON.parse(localStorage.getItem('upload_from_history') || '[]');
          const th = JSON.parse(localStorage.getItem('upload_to_history') || '[]');
          const nextFrom = [
            ...fromValues,
            ...fh
          ].filter(Boolean).reduce((acc, v) => {
            const key = String(v).trim().toLowerCase();
            if (!acc._seen.has(key)) { acc._seen.add(key); acc.out.push(v); }
            return acc;
          }, { _seen: new Set(), out: [] }).out.slice(0, 10);

          const nextTo = [
            ...toValues,
            ...th
          ].filter(Boolean).reduce((acc, v) => {
            const key = String(v).trim().toLowerCase();
            if (!acc._seen.has(key)) { acc._seen.add(key); acc.out.push(v); }
            return acc;
          }, { _seen: new Set(), out: [] }).out.slice(0, 10);

          localStorage.setItem('upload_from_history', JSON.stringify(nextFrom));
          localStorage.setItem('upload_to_history', JSON.stringify(nextTo));
          setFromHistory(nextFrom);
          setToHistory(nextTo);
          localStorage.setItem('upload_history_seeded', 'true');
        }
      } catch (_) {
        // ignore seeding errors silently
      }
    })();
  }, []);

  const addToHistory = (value, kind) => {
    const v = (value || '').trim();
    if (!v) return;
    const key = kind === 'from' ? 'upload_from_history' : 'upload_to_history';
    const current = kind === 'from' ? [...fromHistory] : [...toHistory];
    // put most recent first, unique, max 10
    const next = [v, ...current.filter(x => (x || '').trim().toLowerCase() !== v.toLowerCase())].slice(0, 10);
    if (kind === 'from') setFromHistory(next); else setToHistory(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) {}
  };

  useEffect(() => {
    // If role switches to admin/dean/user and we still have no departments, try again
            const isPriv = role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'dean';
    if (isPriv && !departmentsLoading && departments.length === 0) {
      fetchDepartments();
    }
  }, [role]);

  // Prefill/lock visibility for Dean: own department + Admins
  useEffect(() => {
    const isDean = role?.toLowerCase() === 'dean';
    const deanDeptId = currentUser?.department_id;
    if (isDean && deanDeptId) {
      // Default to 'specific', but do not lock the mode so dean can choose other allowed modes
      if (!visibilityMode) setVisibilityMode('specific');
      setSelectedVisibility([Number(deanDeptId)]);
      setSelectedRoles(['ADMIN']); // ensure Admins always included
    }
  }, [role, currentUser]);



  // Add new document type
  const addNewDocType = async () => {
    if (!newDocTypeName.trim()) return;
    
    setAddingDocType(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/document-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newDocTypeName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchDocumentTypes(); // Refresh the list
          setDocType(newDocTypeName.trim()); // Select the newly added type
          setNewDocTypeName('');
          setShowAddDocTypeModal(false);
          setSuccessMessage(`Document type "${newDocTypeName.trim()}" added successfully`);
        } else {
          setErrorMessage(data.message || 'Failed to add document type');
        }
      } else {
        setErrorMessage('Failed to add document type');
      }
    } catch (error) {
      console.error('Error adding document type:', error);
      setErrorMessage('Error adding document type');
    } finally {
      setAddingDocType(false);
    }
  };

  // Add new folder
  const addNewFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setAddingFolder(true);
    try {
      const response = await fetchWithRetry('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchFolders(); // Refresh the list
          // Select newly added folder in both legacy name and multi-select ids
          setSelectedFolder(newFolderName.trim());
          if (data.folder?.folder_id) {
            setSelectedFolderIds(prev => Array.from(new Set([...(prev || []), Number(data.folder.folder_id)])));
          }
          setNewFolderName('');
          setShowAddFolderModal(false);
          setSuccessMessage(`Folder "${newFolderName.trim()}" added successfully`);
        } else {
          setErrorMessage(data.message || 'Failed to add folder');
        }
      } else {
        setErrorMessage('Failed to add folder');
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      setErrorMessage('Error adding folder');
    } finally {
      setAddingFolder(false);
    }
  };

  // Show success message for 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Add new Google Drive link
  const addDriveLink = async (e) => {
    // Prevent any default form submission behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let newErrors = {};
    if (!linkTitle.trim()) newErrors.linkTitle = 'Title required';
    if (!docReference.trim()) newErrors.docReference = 'Reference required';
    if (!fromField.trim()) newErrors.fromField = 'Sender required';
    if (!toField.trim()) newErrors.toField = 'Recipient required';
    if (!dateTimeReceived.trim()) newErrors.dateTimeReceived = 'Date/time required';
    if (!docType.trim()) newErrors.docType = 'Document type required';
    
    // Validate multiple links
    const validLinks = multipleLinks.filter(link => link.link.trim());
    if (validLinks.length === 0) {
      newErrors.multipleLinks = 'At least one Google Drive link is required';
    }
    
    // Check for invalid links
    const invalidLinks = multipleLinks.filter(link => 
      link.link.trim() && !isValidDriveLink(link.link)
    );
    if (invalidLinks.length > 0) {
      newErrors.multipleLinks = 'One or more Google Drive links are invalid';
    }
    if (
      (role?.toLowerCase() === 'dean' || role?.toLowerCase() === 'admin') &&
      visibilityMode === 'specific' &&
      selectedVisibility.length === 0
    ) {
      newErrors.selectedVisibility = 'Select at least one department';
    }
    if (requireAction && selectedActions.length === 0) {
      newErrors.selectedActions = 'Select at least one action';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Show loading state
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
        // Gather valid links
        const validLinks = multipleLinks.filter(link => link.link.trim());
      
        // EDIT MODE: update existing document and return
        if (editingId) {
          const firstValid = validLinks[0];
          const updates = {
            title: linkTitle,
            reference: docReference,
            from_field: fromField,
            to_field: toField,
            date_received: dateTimeReceived || null,
            description,
            available_copy: availableCopy,
            category: docType,
            // Keep legacy single folder name for backward compatibility
            folder: (() => {
              if (selectedFolderIds.length > 0) {
                const firstId = Number(selectedFolderIds[0]);
                const match = (folders || []).find(f => Number(f.folder_id) === firstId);
                return match ? match.name : selectedFolder;
              }
              return selectedFolder;
            })(),
            // New multi-folder mapping
            folder_ids: selectedFolderIds,
            ...(revision && { revision }),
            ...(revisionDate && { rev_date: revisionDate }),
            ...(firstValid?.link ? { google_drive_link: firstValid.link } : {}),
          };
      
          const result = await updateDocument(editingId, updates);
          if (!result?.success) {
            setErrorMessage(result?.message || 'Failed to update document');
          } else {
            setSuccessMessage('✅ Document updated successfully');
            // Refresh notifications immediately after successful update
            refreshNotificationsImmediately();
            // Show a brief toast notification for update success
            try {
              const editToast = document.createElement('div');
              editToast.style.cssText = `
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
              editToast.textContent = '✅ Document updated';
              document.body.appendChild(editToast);
              setTimeout(() => {
                if (editToast.parentNode) {
                  editToast.parentNode.removeChild(editToast);
                }
              }, 3000);
            } catch (_) {}
            setTimeout(() => {
              if (onNavigateToDocuments) onNavigateToDocuments('documents');
            }, 1000);
          }
          return;
        }
      
        // CREATE MODE: continue with the existing create loop
        for (let i = 0; i < validLinks.length; i++) {
          const linkData = validLinks[i];
          const uniqueTitle = validLinks.length > 1 
            ? `${linkTitle} - Link ${i + 1}` 
            : linkTitle;
      
      // Add to database via context
      let finalVisibility;
      let finalUsers = [];
      let finalRoles = [];
      let finalRoleDept = null;
      
      if (role?.toLowerCase() === 'dean' || role?.toLowerCase() === 'admin') {
        switch (visibilityMode) {
          case 'all':
            finalVisibility = 'ALL';
            break;
          case 'specific':
            if (selectedVisibility.length > 0) {
              finalVisibility = selectedVisibility; // array of department IDs
            } else {
              finalVisibility = 'ALL';
            }
            break;
          case 'users':
            if (selectedUsers.length > 0) {
              finalUsers = selectedUsers; // array of user IDs
              finalVisibility = 'SPECIFIC_USERS';
            } else {
              finalVisibility = 'ALL';
            }
            break;
          case 'roles':
            if (selectedRoles.length > 0) {
              finalRoles = selectedRoles; // array of roles
              finalVisibility = 'SPECIFIC_ROLES';
            } else {
              finalVisibility = 'ALL';
            }
            break;
          case 'role_dept':
            if (selectedRoleDept.role && selectedRoleDept.department) {
              finalRoleDept = selectedRoleDept; // { role, department }
              finalVisibility = 'ROLE_DEPARTMENT';
            } else {
              finalVisibility = 'ALL';
            }
            break;
          default:
            finalVisibility = 'ALL';
        }
      } else {
        // Faculty don't configure visibility; default to ALL
        finalVisibility = 'ALL';
      }

      // Hard enforce dean rule regardless of UI selections
      if (role?.toLowerCase() === 'dean') {
        const deanDeptId = currentUser?.department_id ? Number(currentUser.department_id) : undefined;
        if (deanDeptId) {
          finalVisibility = [deanDeptId];
          // include Admins to allowed_roles
          finalRoles = Array.from(new Set([...(finalRoles || []), 'ADMIN']));
        }
      }

      // Derive readable action names for frontend-only Requests view
      const actionRequiredNames = selectedActions.map(id => {
        const found = actionOptions.find(a => a.id === id);
        return found ? found.name : id;
      });

      // Build action assignments for backend (who is the action assigned to)
      let actionAssignments = [];
      if (requireAction && selectedActions.length > 0) {
        if (visibilityMode === 'users' && selectedUsers.length > 0) {
          actionAssignments = selectedActions.flatMap(actionId =>
            selectedUsers.map(uid => ({ action_id: Number(actionId), assigned_to_user_id: Number(uid) }))
          );
        } else if (visibilityMode === 'roles' && selectedRoles.length > 0) {
          actionAssignments = selectedActions.flatMap(actionId =>
            selectedRoles.map(r => ({ action_id: Number(actionId), assigned_to_role: r }))
          );
        } else if (visibilityMode === 'specific' && selectedVisibility.length > 0) {
          actionAssignments = selectedActions.flatMap(actionId =>
            selectedVisibility.map(deptId => ({ action_id: Number(actionId), assigned_to_department_id: Number(deptId) }))
          );
        } else if (visibilityMode === 'role_dept' && selectedRoleDept.role && selectedRoleDept.department) {
          actionAssignments = selectedActions.map(actionId => ({
            action_id: Number(actionId),
            assigned_to_role: selectedRoleDept.role,
            assigned_to_department_id: Number(selectedRoleDept.department)
          }));
        }
        // Always include Admin in requests when Dean is creating
        if (role?.toLowerCase() === 'dean') {
          const adminAssignments = selectedActions.map(actionId => ({ action_id: Number(actionId), assigned_to_role: 'ADMIN' }));
          actionAssignments = [...actionAssignments, ...adminAssignments];
        }
      }

      // Derive backend-aligned visibility fields
      const visible_to_all = finalVisibility === 'ALL' ? 1 : 0;
      const departmentIds = Array.isArray(finalVisibility) ? finalVisibility.map(Number) : [];
      const allowed_user_ids = finalUsers && finalUsers.length ? finalUsers.map(Number) : undefined;
      const allowed_roles = finalRoles && finalRoles.length ? finalRoles : undefined;

      const documentForContext = {
          title: uniqueTitle, // Use auto-generated unique title
        reference: docReference, // Fixed field name
        from_field: fromField,
        to_field: toField,
        date_received: dateTimeReceived,
          google_drive_link: linkData.link, // Fixed field name
        description: description,
        available_copy: availableCopy, // Add available copy field
        // Backend visibility fields
        visible_to_all,
        ...(departmentIds.length > 0 && { departmentIds }),
        ...(allowed_user_ids && { allowed_user_ids }),
        ...(allowed_roles && { allowed_roles }),
        category: docType,
        // legacy single folder name for backward compatibility
        folder: (() => {
          if (selectedFolderIds.length > 0) {
            const firstId = Number(selectedFolderIds[0]);
            const match = (folders || []).find(f => Number(f.folder_id) === firstId);
            return match ? match.name : selectedFolder;
          }
          return selectedFolder;
        })(),
        // multi-folder ids
        ...(Array.isArray(selectedFolderIds) && selectedFolderIds.length > 0 ? { folder_ids: selectedFolderIds } : {}),
        ...(revision && { revision }),
        ...(revisionDate && { rev_date: revisionDate }),
        // Frontend helper (optional)
        visibility: finalVisibility,
        ...(finalUsers.length > 0 && { targetUsers: finalUsers }),
        ...(finalRoles.length > 0 && { targetRoles: finalRoles }),
        // Action requirements
        ...(requireAction && selectedActions.length > 0 && { actionRequired: selectedActions }),
        ...(requireAction && actionRequiredNames.length > 0 && { actionRequiredNames }),
        ...(requireAction && actionAssignments.length > 0 && { actionAssignments }),
      };
      
      const result = await addDocument(documentForContext);
      
        if (!result.success) {
          setErrorMessage(result.message);
          return;
        }
      }
      
      // All documents processed successfully
        // Save From/To to history
        addToHistory(fromField, 'from');
        addToHistory(toField, 'to');
        // Clear form fields
        setNewLink(''); 
        setLinkTitle(''); 
        setDocReference(''); 
        setFromField(''); 
        setToField(''); 
        setDateTimeReceived(''); 
        setDocType(''); 
        setSelectedFolder(''); // Reset folder selection
        setSelectedFolderIds([]);
        setDescription(''); 
        setSelectedVisibility([]); 
        setVisibilityMode('');
        setSelectedUsers([]);
        setSelectedRoles([]);
        setSelectedRoleDept({ role: '', department: '' });
        setUserFilterDept('');
        setUserFilterRole('');
        setSelectedActions([]);
        setErrors({});
        setRevision('');
        setRevisionDate('');
        setAvailableCopy('soft_copy'); // Reset available copy to default
        setIsPrefilledFromAnswered(false); // Reset pre-filled flag
      setMultipleLinks([{ id: 1, link: '' }]); // Reset to single link field
        
        // Show success message with unique titles
      const titleList = validLinks.length > 1 
        ? validLinks.map((_, i) => `${linkTitle} - Link ${i + 1}`).join(', ')
        : linkTitle;
      setSuccessMessage(`✅ ${validLinks.length} document(s) uploaded successfully: ${titleList}`);
        
        // Refresh notifications immediately after successful document creation
        refreshNotificationsImmediately();
        
        // Set flag to show success message when returning to documents
        sessionStorage.setItem('returningFromUpload', 'true');
        
        // Show toast notification
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
      const toastTitleList = validLinks.length > 1 
        ? validLinks.map((_, i) => `${linkTitle} - Link ${i + 1}`).join(', ')
        : linkTitle;
      successMessage.textContent = `✅ ${validLinks.length} document(s) uploaded: ${toastTitleList}`;
        document.body.appendChild(successMessage);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 3000);

        // Auto-navigate back to documents after 2 seconds
        setTimeout(() => {
          if (onNavigateToDocuments) {
            onNavigateToDocuments('documents');
          }
        }, 2000);
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrorMessage('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Remove drive link
  const removeDriveLink = (linkId) => {
    setMultipleLinks(prev => prev.filter(link => link.id !== linkId));
  };

  // Add new link field
  const addNewLinkField = () => {
    const newId = Math.max(...multipleLinks.map(link => link.id), 0) + 1;
    setMultipleLinks(prev => [...prev, { id: newId, link: '' }]);
  };

  // Remove link field
  const removeLinkField = (linkId) => {
    if (multipleLinks.length > 1) {
      setMultipleLinks(prev => prev.filter(link => link.id !== linkId));
    }
  };

  // Update link field
  const updateLinkField = (linkId, field, value) => {
    setMultipleLinks(prev => prev.map(link => 
      link.id === linkId ? { ...link, [field]: value } : link
    ));
  };

  // Reset selected preview link when links change
  useEffect(() => {
    const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
    if (selectedPreviewLink >= validLinks.length) {
      setSelectedPreviewLink(0);
    }
  }, [multipleLinks, selectedPreviewLink]);

  // Process all links (simulate)
  const processLinks = async () => {
    if (multipleLinks.length === 0) return;
    setUploading(true);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUploading(false);
  };

  // File type from link
  const getFileTypeFromLink = (link) => {
    if (link.includes('/document/')) return '📝';
    if (link.includes('/spreadsheets/')) return '📊';
    if (link.includes('/presentation/')) return '📈';
    if (link.includes('/file/d/')) return '📁';
    return '🔗';
  };

  // 1. Add a function to generate a Google Drive preview URL from the input link
  function getDrivePreviewUrl(link) {
    if (!link) return null;
    // File
    let match = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    // Doc
    match = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/document/d/${match[1]}/preview`;
    // Sheet
    match = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/spreadsheets/d/${match[1]}/preview`;
    // Slides
    match = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/presentation/d/${match[1]}/preview`;
    return null;
  }

  // Filter users based on selected filters
  const getFilteredUsers = () => {
    let filtered = users;
    // If Dean, restrict to own department users
    if (role?.toLowerCase() === 'dean' && currentUser?.department_id) {
      filtered = filtered.filter(user => Number(user.department_id) === Number(currentUser.department_id));
    }
    
    if (userFilterDept) {
      filtered = filtered.filter(user => user.department_id == userFilterDept);
    }
    
    if (userFilterRole) {
      filtered = filtered.filter(user => user.role === userFilterRole);
    }
    
    return filtered;
  };

  return (
    <div style={{...styles.outerWrap, padding: isMobile ? '16px' : '32px 0'}}>
      <div style={{...styles.flexCard, maxWidth: isMobile ? '100%' : 1200}}>
        <div style={{...styles.formCol, padding: isMobile ? '16px' : '32px'}}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            marginBottom: '24px',
            gap: isMobile ? '12px' : '0'
          }}>
            <div>
              <h2 style={{...styles.title, fontSize: isMobile ? '24px' : '28px'}}>{editingId ? 'Update Document' : 'Upload Google Drive Link'}</h2>
              {isPrefilledFromAnswered && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginTop: '8px',
                  fontSize: '13px',
                  color: '#0c4a6e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FiCheck size={14} />
                  Pre-filled from answered request - modify as needed
                </div>
              )}
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              {(() => {
                const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
                return validLinks.length > 0 && (
                <button
                  onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: showPreviewPanel ? '#111' : 'white',
                    color: showPreviewPanel ? 'white' : '#475569',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <FiMaximize2 style={{ fontSize: '14px' }} />
                  {showPreviewPanel ? 'Hide Preview' : 'Show Preview'}
                </button>
                );
              })()}
              {onNavigateToDocuments && (
                <button
                  onClick={() => onNavigateToDocuments('documents')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: '#475569',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  ← Back to Documents
                </button>
              )}
            </div>
          </div>
          <div style={{...styles.formInner, padding: isMobile ? '16px' : '32px'}}>
            {/* Document Info */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Title</div>
                <input style={styles.input} type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder=" " />
                {errors.linkTitle && <div style={styles.error}>{errors.linkTitle}</div>}
              </div>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Reference</div>
                <input style={styles.input} type="text" value={docReference} onChange={e => setDocReference(e.target.value)} placeholder=" " />
                {errors.docReference && <div style={styles.error}>{errors.docReference}</div>}
              </div>
            </div>
            <div style={styles.divider} />
            {/* Document Type (dropdown) */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Document Type</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '400px'}}>
                    <select
                      style={styles.select}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      disabled={documentTypes.length === 0}
                    >
                      <option value="">
                        {documentTypes.length === 0 ? 'Loading document types...' : 'Select document type...'}
                      </option>
                      {documentTypes.map(type => (
                        <option key={type.type_id} value={type.type_name}>
                          {type.type_name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown style={styles.selectArrow} />
                  </div>
                  {(role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'dean') && (
                    <button
                      type="button"
                      style={{ ...styles.pill, ...styles.pillAll }}
                      onClick={() => setShowAddDocTypeModal(true)}
                      title="Add new document type"
                    >
                      <FiPlus /> Add Type
                    </button>
                  )}
                </div>
                {errors.docType && <div style={styles.error}>{errors.docType}</div>}
              </div>
            </div>
            <div style={styles.divider} />
            {/* Folder (dropdown) */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Folder</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '400px'}}>
                    <select
                      style={styles.select}
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      disabled={folders.length === 0}
                    >
                      <option value="">
                        {folders.length === 0 ? 'Loading folders...' : 'Select folder...'}
                      </option>
                      {folders.map(folder => (
                        <option key={folder.folder_id} value={folder.name}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown style={styles.selectArrow} />
                  </div>
                  {(role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'dean') && (
                    <button
                      type="button"
                      style={{ ...styles.pill, ...styles.pillAll }}
                      onClick={() => setShowAddFolderModal(true)}
                      title="Add new folder"
                    >
                      <FiPlus /> Add Folder
                    </button>
                  )}
                </div>
                {errors.selectedFolder && <div style={styles.error}>{errors.selectedFolder}</div>}
              </div>
            </div>
            <div style={styles.divider} />
            {/* Sender/Recipient */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>From</div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      type="text"
                      value={fromField}
                      onChange={(e) => { setFromField(e.target.value); setFromOpen(true); }}
                      onFocus={() => setFromOpen(true)}
                      placeholder=" "
                    />
                    <button
                      type="button"
                      onClick={() => setFromOpen((v) => !v)}
                      style={{ ...styles.pill, ...styles.pillAll, padding: '6px 10px' }}
                      aria-label="Toggle from suggestions"
                      title="Show suggestions"
                    >
                      <FiChevronDown />
                    </button>
                  </div>
                  {fromOpen && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 220, overflow: 'auto' }}>
                      {(() => {
                        const q = (fromField || '').trim().toLowerCase();
                        const options = (fromHistory || [])
                          .filter(v => !q || String(v).toLowerCase().includes(q));
                        if (options.length === 0) {
                          return (
                            <div style={{ padding: 10, color: '#6b7280' }}>No matches. Press Enter to use "{fromField}".</div>
                          );
                        }
                        return options.map((item, idx) => (
                          <button
                            key={`from-opt-${idx}`}
                            type="button"
                            onClick={() => { setFromField(item); setFromOpen(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: '#fff', border: 'none', cursor: 'pointer' }}
                          >
                            {item}
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
                {errors.fromField && <div style={styles.error}>{errors.fromField}</div>}
              </div>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>To</div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      type="text"
                      value={toField}
                      onChange={(e) => { setToField(e.target.value); setToOpen(true); }}
                      onFocus={() => setToOpen(true)}
                      placeholder=" "
                    />
                    <button
                      type="button"
                      onClick={() => setToOpen((v) => !v)}
                      style={{ ...styles.pill, ...styles.pillAll, padding: '6px 10px' }}
                      aria-label="Toggle to suggestions"
                      title="Show suggestions"
                    >
                      <FiChevronDown />
                    </button>
                  </div>
                  {toOpen && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 220, overflow: 'auto' }}>
                      {(() => {
                        const q = (toField || '').trim().toLowerCase();
                        const options = (toHistory || [])
                          .filter(v => !q || String(v).toLowerCase().includes(q));
                        if (options.length === 0) {
                          return (
                            <div style={{ padding: 10, color: '#6b7280' }}>No matches. Press Enter to use "{toField}".</div>
                          );
                        }
                        return options.map((item, idx) => (
                          <button
                            key={`to-opt-${idx}`}
                            type="button"
                            onClick={() => { setToField(item); setToOpen(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: '#fff', border: 'none', cursor: 'pointer' }}
                          >
                            {item}
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
                {errors.toField && <div style={styles.error}>{errors.toField}</div>}
              </div>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Date/Time Received</div>
                <input 
                  style={{
                    ...styles.input,
                    ...(isMobile ? {
                      fontSize: '16px', // Prevents zoom on iOS
                      minHeight: '44px', // Better touch target
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    } : {})
                  }} 
                  type="date" 
                  value={dateTimeReceived} 
                  onChange={e => setDateTimeReceived(e.target.value)} 
                  placeholder="mm/dd/yyyy"
                />
                {errors.dateTimeReceived && <div style={styles.error}>{errors.dateTimeReceived}</div>}
              </div>
            </div>
            <div style={styles.divider} />
            {/* Description */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></div>
                <textarea
                  style={styles.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the document..."
                  rows={3}
                />
              </div>
            </div>
            <div style={styles.divider} />
            {/* Google Drive Links */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Google Drive Links</div>
                <div style={{ width: '100%' }}>
                  {multipleLinks.map((linkData, index) => (
                    <div key={linkData.id} style={{ 
                      display: 'flex', 
                      gap: 18, 
                      alignItems: 'flex-start', 
                      marginBottom: 18,
                      paddingBottom: 18,
                      borderBottom: index < multipleLinks.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.inputLabel}>
                          Google Drive Link {index + 1}
                        </div>
                <input 
                  style={styles.input} 
                  type="url" 
                          value={linkData.link} 
                          onChange={e => updateLinkField(linkData.id, 'link', e.target.value)} 
                          placeholder="https://drive.google.com/..." 
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: 8, 
                        alignItems: 'flex-end',
                        paddingTop: 20
                      }}>
                      {!editingId && multipleLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLinkField(linkData.id)}
                            style={{
                              ...styles.pill,
                              background: '#ef4444',
                              color: 'white',
                              border: '1.5px solid #ef4444',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: 0,
                              margin: 0
                            }}
                            title="Remove this link"
                          >
                            <FiX />
                          </button>
                        )}
                        {!editingId && (
                        <button
                          type="button"
                          onClick={addNewLinkField}
                          style={{
                            ...styles.pill,
                            background: '#10b981',
                            color: 'white',
                            border: '1.5px solid #10b981',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: 0,
                            margin: 0
                          }}
                          title="Add another link"
                        >
                          <FiPlus />
                        </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {errors.multipleLinks && <div style={styles.error}>{errors.multipleLinks}</div>}
                </div>
              </div>
            </div>
            <div style={styles.divider} />
            {/* Available Copy Type */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Available Copy</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '400px'}}>
                    <select
                      style={styles.select}
                      value={availableCopy}
                      onChange={(e) => setAvailableCopy(e.target.value)}
                    >
                      <option value="soft_copy">Soft Copy (Digital)</option>
                      <option value="hard_copy">Hard Copy (Physical)</option>
                      <option value="both">Both (Digital & Physical)</option>
                    </select>
                    <FiChevronDown style={styles.selectArrow} />
                  </div>
                </div>
              </div>
              <div style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
                Select the format in which this document is available.
              </div>
            </div>
            <div style={styles.divider} />
            {/* Revision */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Revision <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></div>
                <input
                  style={styles.input}
                  type="text"
                  value={revision}
                  onChange={e => setRevision(e.target.value)}
                  placeholder="Revision number or notes"
                />
              </div>
            </div>
            <div style={styles.divider} />
            {/* Revision Date */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Revision Date <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></div>
                <input
                  style={styles.input}
                  type="date"
                  value={revisionDate}
                  onChange={e => setRevisionDate(e.target.value)}
                  placeholder="Revision date"
                />
              </div>
            </div>
            <div style={styles.divider} />
                          {/* Department Visibility - For Dean, Admin, and User */}
            {(role?.toLowerCase() === 'dean' || role?.toLowerCase() === 'admin') && (
              <div style={styles.section}>
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>Visibility</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '400px'}}>
                      <select
                        style={styles.select}
                        value={visibilityMode}
                        onChange={(e) => {
                          const mode = e.target.value;
                          setVisibilityMode(mode);
                          if (mode === 'all') {
                            setSelectedVisibility(departments.map(d => Number(d.department_id)));
                          } else if (mode === 'specific') {
                            setSelectedVisibility([]);
                          } else {
                            setSelectedVisibility([]);
                          }
                        }}
                        disabled={departmentsLoading || departments.length === 0}
                      >
                        <option value="">Select visibility...</option>
                        {/* Admin options */}
                        {role?.toLowerCase() === 'admin' && (
                          <>
                            <option value="all">All Departments</option>
                            <option value="specific">Specific Departments</option>
                            <option value="users">Specific Users</option>
                            <option value="roles">Specific Roles</option>
                          </>
                        )}
                        {/* Dean options (no 'All', no 'Role+Department') */}
                        {role?.toLowerCase() === 'dean' && (
                          <>
                            <option value="specific">Specific Departments</option>
                            <option value="users">Specific Users</option>
                          </>
                        )}
                      </select>
                      <FiChevronDown style={styles.selectArrow} />
                    </div>
                  </div>
                  {errors.selectedVisibility && <div style={styles.error}>{errors.selectedVisibility}</div>}
                </div>
                
                {/* Specific Department Selection - Show when "Specific" is selected */}
                {visibilityMode === 'specific' && (
                  <div>
                    <div style={styles.inputRow}>
                      <div style={styles.inputLabel}>Select Departments</div>
                      <div style={{ position: 'relative', width: isMobile ? '100%' : '480px' }}>
                        <button
                          type="button"
                          onClick={() => setDeptDropdownOpen(v => !v)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            background: '#fff',
                            color: '#374151',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          disabled={role?.toLowerCase() === 'dean'}
                        >
                          <span>
                            {role?.toLowerCase() === 'dean'
                              ? 'Your Department (locked)'
                              : selectedVisibility.length > 0
                              ? `${selectedVisibility.length} department${selectedVisibility.length > 1 ? 's' : ''} selected`
                              : 'Choose departments...'}
                          </span>
                          <FiChevronDown />
                        </button>

                        {deptDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              width: '100%',
                              maxHeight: 320,
                              overflow: 'auto',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                              zIndex: 10,
                              padding: 8
                            }}
                          >
                            <input
                              type="text"
                              value={deptSearch}
                              onChange={(e) => setDeptSearch(e.target.value)}
                              placeholder="Search department name or code..."
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 6,
                                marginBottom: 8
                              }}
                            />
                            {departmentsLoading && <div style={{ padding: 8, color: '#6b7280' }}>Loading departments...</div>}
                            {!departmentsLoading && (
                              (() => {
                                const q = deptSearch.trim().toLowerCase();
                                const list = q
                                  ? departments.filter(d =>
                                      (d.name || '').toLowerCase().includes(q) ||
                                      (d.code || '').toLowerCase().includes(q)
                                    )
                                  : departments;
                                if (list.length === 0) {
                                  return <div style={{ padding: 8, color: '#6b7280' }}>No departments match the current filter.</div>;
                                }
                                return (
                                  <div>
                                    {list.map(dept => {
                                      const id = dept.department_id;
                                      const checked = selectedVisibility.includes(id);
                                      return (
                                        <label
                                          key={id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 8px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            background: checked ? '#f1f5f9' : 'transparent'
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              const isChecked = e.target.checked;
                                              setSelectedVisibility(prev =>
                                                isChecked ? [...prev, id] : prev.filter(v => v !== id)
                                              );
                                            }}
                                            style={{ width: 16, height: 16, borderRadius: '50%', accentColor: '#111' }}
                                            disabled={role?.toLowerCase() === 'dean'}
                                          />
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 14, color: '#111827' }}>{dept.name}</span>
                                            <span style={{ fontSize: 12, color: '#6b7280' }}>{dept.code}</span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                );
                              })()
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => setDeptDropdownOpen(false)}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 6,
                                  background: '#fff',
                                  color: '#374151'
                                }}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Specific Users Selection */}
                {visibilityMode === 'users' && (
                  <div>
                  {/* User Filters */}
                    {role?.toLowerCase() !== 'dean' && (
                      <div style={styles.inputRow}>
                        <div style={styles.inputLabel}>Filter Users</div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                          <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '200px'}}>
                            <select
                              style={styles.select}
                              value={userFilterDept}
                              onChange={(e) => setUserFilterDept(e.target.value)}
                            >
                              <option value="">All Departments</option>
                              {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                  {dept.name} ({dept.code})
                                </option>
                              ))}
                            </select>
                            <FiChevronDown style={styles.selectArrow} />
                          </div>
                          <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '200px'}}>
                            <select
                              style={styles.select}
                              value={userFilterRole}
                              onChange={(e) => setUserFilterRole(e.target.value)}
                            >
                              <option value="">All Roles</option>
                              <option value="ADMIN">Admin</option>
                              <option value="DEAN">Dean</option>
                              <option value="FACULTY">Faculty</option>
                            </select>
                            <FiChevronDown style={styles.selectArrow} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Selection (Searchable Dropdown) */}
                    <div style={styles.inputRow}>
                      <div style={styles.inputLabel}>Select Users</div>
                      <div style={{ position: 'relative', width: isMobile ? '100%' : '480px' }}>
                        <button
                          type="button"
                          onClick={() => setUserDropdownOpen(v => !v)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            background: '#fff',
                            color: '#374151',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            {selectedUsers.length > 0
                              ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`
                              : 'Choose users...'}
                          </span>
                          <FiChevronDown />
                        </button>

                        {userDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '110%',
                              left: 0,
                              width: '100%',
                              maxHeight: 320,
                              overflow: 'auto',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                              zIndex: 10,
                              padding: 8
                            }}
                          >
                            <input
                              type="text"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search by email or name..."
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 6,
                                marginBottom: 8
                              }}
                            />
                            {usersLoading && <div style={{ padding: 8, color: '#6b7280' }}>Loading users...</div>}
                            {!usersLoading && (
                              (() => {
                                const base = getFilteredUsers();
                                const q = userSearch.trim().toLowerCase();
                                const list = q
                                  ? base.filter(u =>
                                      (u.email || '').toLowerCase().includes(q) ||
                                      (u.full_name || '').toLowerCase().includes(q)
                                    )
                                  : base;
                                if (list.length === 0) {
                                  return <div style={{ padding: 8, color: '#6b7280' }}>No users match the current filters.</div>;
                                }
                                return (
                                  <div>
                                    {list.map(user => {
                                      const checked = selectedUsers.includes(user.user_id);
                                      return (
                                        <label
                                          key={user.user_id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 8px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            background: checked ? '#f1f5f9' : 'transparent'
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              const isChecked = e.target.checked;
                                              setSelectedUsers(prev =>
                                                isChecked ? [...prev, user.user_id] : prev.filter(id => id !== user.user_id)
                                              );
                                            }}
                                            style={{ width: 16, height: 16, borderRadius: '50%', accentColor: '#111' }}
                                          />
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 14, color: '#111827' }}>{user.email || '—'}</span>
                                            <span style={{ fontSize: 12, color: '#6b7280' }}>{user.full_name} ({user.role})</span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                );
                              })()
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => setUserDropdownOpen(false)}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 6,
                                  background: '#fff',
                                  color: '#374151'
                                }}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {!usersLoading && getFilteredUsers().length > 0 && (
                        <div style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
                          Showing {getFilteredUsers().length} of {users.length} users
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specific Roles Selection */}
                {visibilityMode === 'roles' && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Select Roles</div>
                    <div style={{ position: 'relative', width: isMobile ? '100%' : '320px' }}>
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen(v => !v)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#fff',
                          color: '#374151',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>
                          {selectedRoles.length > 0
                            ? `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`
                            : 'Choose roles...'}
                        </span>
                        <FiChevronDown />
                      </button>

                      {roleDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '110%',
                            left: 0,
                            width: '100%',
                            maxHeight: 240,
                            overflow: 'auto',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            zIndex: 10,
                            padding: 8
                          }}
                        >
                          <input
                            type="text"
                            value={roleSearch}
                            onChange={(e) => setRoleSearch(e.target.value)}
                            placeholder="Search roles..."
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              marginBottom: 8
                            }}
                          />
                          {(() => {
                            const allRoles = ['ADMIN', 'DEAN', 'FACULTY'];
                            const q = roleSearch.trim().toLowerCase();
                            const list = q ? allRoles.filter(r => r.toLowerCase().includes(q)) : allRoles;
                            return (
                              <div>
                                {list.map(role => {
                                  const checked = selectedRoles.includes(role);
                                  return (
                                    <label
                                      key={role}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        background: checked ? '#f1f5f9' : 'transparent'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          setSelectedRoles(prev =>
                                            isChecked ? [...prev, role] : prev.filter(r => r !== role)
                                          );
                                        }}
                                        style={{ width: 16, height: 16, borderRadius: '50%', accentColor: '#111' }}
                                      />
                                      <span style={{ fontSize: 14, color: '#111827' }}>{role}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })()}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => setRoleDropdownOpen(false)}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 6,
                                background: '#fff',
                                color: '#374151'
                              }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Role + Department Selection */}
                {visibilityMode === 'role_dept' && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Select Role</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                      <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '200px'}}>
                        <select
                          style={styles.select}
                          value={selectedRoleDept.role}
                          onChange={(e) => setSelectedRoleDept(prev => ({ ...prev, role: e.target.value }))}
                        >
                          <option value="">Select role...</option>
                          <option value="ADMIN">Admin</option>
                          <option value="DEAN">Dean</option>
                          <option value="FACULTY">Faculty</option>
                        </select>
                        <FiChevronDown style={styles.selectArrow} />
                      </div>
                    </div>
                    
                    {selectedRoleDept.role && (
                      <div style={styles.inputRow}>
                        <div style={styles.inputLabel}>Select Department</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                          <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '200px'}}>
                            <select
                              style={styles.select}
                              value={selectedRoleDept.department}
                              onChange={(e) => setSelectedRoleDept(prev => ({ ...prev, department: e.target.value }))}
                              disabled={role?.toLowerCase() === 'dean'}
                            >
                              <option value="">Select department...</option>
                              {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                  {dept.name} ({dept.code})
                                </option>
                              ))}
                            </select>
                            <FiChevronDown style={styles.selectArrow} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show selected departments summary */}
                {visibilityMode === 'all' && departments.length > 0 && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Selected</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      All {departments.length} departments
                    </div>
                  </div>
                )}
                
                {visibilityMode === 'specific' && selectedVisibility.length > 0 && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Selected</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {selectedVisibility.length} department{selectedVisibility.length !== 1 ? 's' : ''} selected
                    </div>
                  </div>
                )}

                {visibilityMode === 'users' && selectedUsers.length > 0 && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Selected</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </div>
                  </div>
                )}

                {visibilityMode === 'roles' && selectedRoles.length > 0 && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Selected</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected: {selectedRoles.join(', ')}
                    </div>
                  </div>
                )}

                {visibilityMode === 'role_dept' && selectedRoleDept.role && selectedRoleDept.department && (
                  <div style={styles.inputRow}>
                    <div style={styles.inputLabel}>Selected</div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {selectedRoleDept.role} of {departments.find(d => d.department_id == selectedRoleDept.department)?.name}
                      {(() => {
                        const matchingUsers = users.filter(u => 
                          u.role === selectedRoleDept.role && 
                          u.department_id == selectedRoleDept.department
                        );
                        return matchingUsers.length > 0 ? (
                          <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                            {matchingUsers.length === 1 ? (
                              `(${matchingUsers[0].full_name} will receive this document)`
                            ) : (
                              <div>
                                ({matchingUsers.length} users will receive this document)
                                <div style={{ marginTop: '2px', fontSize: '11px' }}>
                                  {matchingUsers.map(u => u.full_name).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={styles.divider} />
            {/* Action Required (optional toggle + dropdown) */}
            <div style={styles.section}>
              <div style={styles.inputRow}>
                <div style={styles.inputLabel}>Requires Action?</div>
                <div>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={requireAction}
                    onClick={() => setRequireAction(prev => !prev)}
                    title={requireAction ? 'Click to disable action required' : 'Click to enable action required'}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid #475569',
                      backgroundColor: requireAction ? '#111' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginRight: 8
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        opacity: requireAction ? 1 : 0,
                        transition: 'opacity 0.15s'
                      }}
                    />
                  </button>
                  <span style={{ color: '#475569', fontSize: 14 }}>Yes</span>
                </div>
              </div>
              {requireAction && (
                <div style={styles.inputRow}>
                  <div style={styles.inputLabel}>Action Required</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{...styles.selectContainer, minWidth: isMobile ? '100%' : '400px'}}>
                      <select
                        style={styles.select}
                        value={selectedActions[0] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setSelectedActions([]);
                          } else {
                            const id = Number(val);
                            setSelectedActions([id]);
                          }
                        }}
                        disabled={actionsLoading || actionOptions.length === 0}
                      >
                        <option value="">
                          {actionsLoading ? 'Loading actions...' :
                           actionOptions.length === 0 ? 'No actions available' : 'Select action required...'}
                        </option>
                        {actionOptions.map(action => (
                          <option key={action.id} value={action.id}>
                            {action.name}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown style={styles.selectArrow} />
                    </div>
                  </div>
                </div>
              )}
              {requireAction && errors.selectedActions && <div style={styles.error}>{errors.selectedActions}</div>}
              <div style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
                {requireAction ? 'Choose what the recipient needs to do with this document.' : 'Toggle on to add an action required.'}
              </div>
            </div>
            <button
              style={{ 
                ...styles.addButton, 
                ...(addBtnHover ? styles.addButtonHover : {}),
                opacity: uploading ? 0.6 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
              onClick={addDriveLink}
              onMouseEnter={() => !uploading && setAddBtnHover(true)}
              onMouseLeave={() => setAddBtnHover(false)}
              disabled={uploading}
            >
            {uploading ? (editingId ? '🔄 Saving...' : '🔄 Uploading...') : (editingId ? 'Save Changes' : 'Add Link')}
            </button>
            {successMessage && (
              <div style={{ color: '#059669', fontWeight: 400, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheck /> {successMessage}
              </div>
            )}
            {errorMessage && (
              <div style={{ color: '#c00', fontWeight: 400, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertCircle /> {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Off-canvas Preview Panel */}
      {showPreviewPanel && (
        <div style={styles.offCanvasOverlay} onClick={() => setShowPreviewPanel(false)}>
          <div style={{...styles.offCanvasPanel, width: isMobile ? '100%' : '50%', minWidth: isMobile ? '100%' : '400px'}} onClick={e => e.stopPropagation()}>
            <div style={styles.offCanvasHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h3 style={styles.offCanvasTitle}>Document Preview</h3>
                {(() => {
                  const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
                  return validLinks.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Link:</span>
                      <select
                        value={selectedPreviewLink}
                        onChange={(e) => setSelectedPreviewLink(Number(e.target.value))}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          color: '#333'
                        }}
                      >
                        {validLinks.map((_, index) => (
                          <option key={index} value={index}>
                            Link {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
              <div style={styles.offCanvasActions}>
                {(() => {
                  const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
                  const selectedLink = validLinks[selectedPreviewLink];
                  return selectedLink && getDrivePreviewUrl(selectedLink.link) && (
                  <button 
                    style={styles.offCanvasActionBtn} 
                    onClick={() => setModalOpen(true)} 
                    title="Magnify Preview"
                  >
                    <FiMaximize2 />
                  </button>
                  );
                })()}
                <button 
                  style={styles.offCanvasCloseBtn} 
                  onClick={() => setShowPreviewPanel(false)} 
                  title="Close Preview"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div style={styles.offCanvasContent}>
              {(() => {
                const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
                const selectedLink = validLinks[selectedPreviewLink];
                return selectedLink && getDrivePreviewUrl(selectedLink.link) ? (
                  <iframe
                    title="Google Drive Preview"
                    src={getDrivePreviewUrl(selectedLink.link)}
                    style={styles.offCanvasIframe}
                    allow="autoplay"
                  />
                ) : (
                  <div style={styles.offCanvasPlaceholder}>
                    <div style={styles.offCanvasPlaceholderIcon}>📄</div>
                    <div style={styles.offCanvasPlaceholderText}>No preview available</div>
                    <div style={styles.offCanvasPlaceholderSubtext}>Add a Google Drive link to see preview</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for magnified preview */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalCloseBtn} onClick={() => setModalOpen(false)} title="Close Preview">
              <FiX />
            </button>
            {(() => {
              const validLinks = multipleLinks.filter(link => link.link.trim() && isValidDriveLink(link.link));
              const selectedLink = validLinks[selectedPreviewLink];
              return selectedLink && (
                <iframe
                  title="Magnified Google Drive Preview"
                  src={getDrivePreviewUrl(selectedLink.link)}
                  style={styles.modalIframe}
                  allow="autoplay"
                />
              );
            })()}
          </div>
        </div>
      )}
      
      {/* Add Document Type Modal */}
      {showAddDocTypeModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddDocTypeModal(false)}>
          <div style={styles.addDocTypeModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Document Type</h3>
              <button 
                style={styles.modalCloseBtn} 
                onClick={() => setShowAddDocTypeModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalInputRow}>
                <label style={styles.modalLabel}>Document Type Name</label>
                <input
                  style={styles.modalInput}
                  type="text"
                  value={newDocTypeName}
                  onChange={e => setNewDocTypeName(e.target.value)}
                  placeholder="e.g., Memo, Report, Policy, etc."
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !addingDocType) {
                      addNewDocType();
                    }
                  }}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  style={styles.modalCancelBtn}
                  onClick={() => {
                    setShowAddDocTypeModal(false);
                    setNewDocTypeName('');
                  }}
                  disabled={addingDocType}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.modalAddBtn,
                    ...(addingDocType ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                  }}
                  onClick={addNewDocType}
                  disabled={addingDocType || !newDocTypeName.trim()}
                >
                  {addingDocType ? 'Adding...' : 'Add Type'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddFolderModal(false)}>
          <div style={styles.addDocTypeModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Folder</h3>
              <button 
                style={styles.modalCloseBtn} 
                onClick={() => setShowAddFolderModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalInputRow}>
                <label style={styles.modalLabel}>Folder Name</label>
                <input
                  style={styles.modalInput}
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g., General, Administrative, Academic, etc."
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !addingFolder) {
                      addNewFolder();
                    }
                  }}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  style={styles.modalCancelBtn}
                  onClick={() => {
                    setShowAddFolderModal(false);
                    setNewFolderName('');
                  }}
                  disabled={addingFolder}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...styles.modalAddBtn,
                    ...(addingFolder ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                  }}
                  onClick={addNewFolder}
                  disabled={addingFolder || !newFolderName.trim()}
                >
                  {addingFolder ? 'Adding...' : 'Add Folder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  outerWrap: {
    minHeight: '100vh',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 0',
    fontFamily: 'Inter, sans-serif',
  },
  flexCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 1200,
    background: '#fff',
    border: '1.5px solid #111',
    borderRadius: 16,
    boxSizing: 'border-box',
    marginBottom: 32,
    overflow: 'hidden',
  },
  formCol: {
    flex: 1,
    padding: 32,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    alignSelf: 'stretch',
    margin: 0,
  },
  formInner: {
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  previewCol: {
    flex: 1,
    borderLeft: '1px solid #eee',
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'stretch',
    padding: 32,
    minWidth: 0,
    height: 'auto',
    alignSelf: 'stretch',
  },
  previewHeader: {
    fontWeight: 600,
    fontSize: 18,
    color: '#111',
    marginBottom: 16,
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    flex: 1,
    border: '1.5px solid #111',
    borderRadius: 8,
    background: '#fff',
    overflow: 'auto',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    border: '1.5px dashed #bbb',
    borderRadius: 8,
    background: '#fff',
    fontSize: 18,
    overflow: 'auto',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111',
    margin: '0 0 24px 0',
    letterSpacing: '-0.02em',
    textAlign: 'center',
    paddingTop: 24,
  },
  section: {
    marginBottom: 0,
  },
  divider: {
    borderBottom: '1px solid #eee',
    margin: '18px 0',
  },
  inputRow: {
    display: 'flex',
    gap: 18,
    marginBottom: 0,
  },
  inputLabel: {
    fontWeight: 400,
    marginBottom: 2,
    color: '#333',
    fontSize: 13,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: 15,
    color: '#111',
    padding: '6px 0 4px 0',
    marginBottom: 10,
    outline: 'none',
    transition: 'none',
    fontFamily: 'inherit',
  },
  selectContainer: {
    position: 'relative',
    flex: 1,
    minWidth: '400px',
  },
  select: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: 15,
    color: '#111',
    padding: '6px 30px 4px 0',
    marginBottom: 10,
    outline: 'none',
    transition: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  },
  selectArrow: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    pointerEvents: 'none',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #ddd',
    borderRadius: 0,
    background: '#fff',
    fontSize: 15,
    color: '#111',
    padding: '6px 0 4px 0',
    marginBottom: 10,
    outline: 'none',
    transition: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 60,
  },
  docTypeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  plusButton: {
    background: '#111',
    border: 'none',
    borderRadius: '50%',
    color: '#fff',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    transition: 'all 0.2s',
    flexShrink: 0,
    ':hover': {
      background: '#333',
      transform: 'scale(1.1)',
    }
  },
  error: {
    color: '#c00',
    fontSize: 12,
    fontWeight: 400,
    marginTop: 6,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    fontSize: 17,
    fontWeight: 600,
    padding: '14px 40px',
    cursor: 'pointer',
    margin: '24px auto 0 auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    transition: 'background 0.18s, transform 0.18s, box-shadow 0.18s',
  },
  addButtonHover: {
    background: '#222',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
  },
  visibilityRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 0,
  },
  pill: {
    border: '1.5px solid #111',
    borderRadius: 999,
    background: '#fff',
    color: '#111',
    fontWeight: 500,
    fontSize: 14,
    padding: '6px 18px',
    margin: '0 8px 8px 0',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.18s',
  },
  pillSelected: {
    background: '#111',
    color: '#fff',
    border: '1.5px solid #111',
  },
  pillAll: {
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  linksListSection: {
    width: '100%',
    maxWidth: 900,
    background: '#fff',
    border: '1.5px solid #111',
    borderRadius: 16,
    padding: 24,
    boxSizing: 'border-box',
  },
  linksListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #eee',
    padding: '10px 0',
    fontSize: 15,
    color: '#111',
  },
  linkInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexWrap: 'wrap',
  },
  linkIcon: {
    fontSize: 18,
    color: '#111',
  },
  linkTitle: {
    fontWeight: 600,
    color: '#111',
    marginRight: 8,
  },
  linkMeta: {
    color: '#444',
    fontSize: 13,
    marginLeft: 8,
  },
  linkUrl: {
    color: '#111',
    fontSize: 16,
    marginLeft: 8,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  linkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#c00',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
  },
  processingIndicator: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
  },
  successIndicator: {
    color: '#111',
    fontSize: 13,
    marginLeft: 8,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },
  errorIndicator: {
    color: '#c00',
    fontSize: 13,
    marginLeft: 8,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },
  magnifyBtn: {
    marginLeft: 8,
    background: 'none',
    border: 'none',
    color: '#111',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    position: 'relative',
    background: '#fff',
    borderRadius: 12,
    padding: 0,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: 900,
    height: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'none',
    border: 'none',
    color: '#111',
    fontSize: 28,
    cursor: 'pointer',
    zIndex: 2,
    padding: 4,
  },
  modalIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    flex: 1,
    background: '#fff',
  },
  addDocTypeModal: {
    position: 'relative',
    background: '#fff',
    borderRadius: 12,
    padding: 0,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: 450,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 0 24px',
    borderBottom: '1px solid #eee',
    paddingBottom: 16,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#111',
  },
  modalBody: {
    padding: 24,
  },
  modalInputRow: {
    marginBottom: 20,
  },
  modalLabel: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  },
  modalInput: {
    width: '100%',
    border: '1.5px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    fontSize: 15,
    color: '#111',
    padding: '12px 16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalCancelBtn: {
    background: 'transparent',
    border: '1.5px solid #ddd',
    borderRadius: 8,
    color: '#666',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalAddBtn: {
    background: '#111',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Off-canvas Preview Panel Styles
  offCanvasOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  offCanvasPanel: {
    width: '50%',
    minWidth: '400px',
    maxWidth: '800px',
    backgroundColor: '#fff',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease-out',
  },
  offCanvasHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fafafa',
  },
  offCanvasTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111',
  },
  offCanvasActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  offCanvasActionBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    color: '#666',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  offCanvasCloseBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    color: '#666',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  offCanvasContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  offCanvasIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#fff',
  },
  offCanvasPlaceholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#888',
    textAlign: 'center',
  },
  offCanvasPlaceholderIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  offCanvasPlaceholderText: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#666',
  },
  offCanvasPlaceholderSubtext: {
    fontSize: '14px',
    color: '#999',
  },

};

export default Update; 
