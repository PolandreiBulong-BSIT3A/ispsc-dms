import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownUp, ArrowUp, ArrowDown, Trash2, Search, Envelope, Trash, ExclamationTriangle, X } from 'react-bootstrap-icons';
import { FiX, FiEdit, FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiDownload, FiUpload, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiSettings, FiUser, FiCheck } from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext';
import socket from '../../lib/realtime/socket.js';
import { buildUrl, fetchJson } from '../../lib/api/frontend/client.js';

const User = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    department: '',
    role: ''
  });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]); // bulk selection
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { user: currentUser } = useUser();

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success', duration = 2500) => {
    setToast({ visible: true, message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ visible: false, message: '', type }), duration);
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Function to get department name from ID
  const getDepartmentName = (departmentId) => {
    const departmentMap = {
      1: 'College of Arts and Sciences',
      2: 'College of Management and Business Economics',
      3: 'College of Teacher Education',
      4: 'Laboratory High School',
      5: 'Non-Teaching Personnel',
      6: 'Graduate School',
      7: 'Student Council'
    };
    return departmentMap[departmentId] || `Department ID: ${departmentId}`;
  };

  // Determine access level - use session-based user data
  const roleLower = (role || currentUser?.role || '').toString().toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'administrator';
  const isDean = roleLower === 'dean';
  const isFaculty = roleLower === 'faculty';

  // Use session-based user role for dean detection
      const effectiveIsDean = isDean || (currentUser?.role === 'DEAN' || currentUser?.role === 'dean');

  // Normalize API user row to UI shape
  const normalizeUser = (row) => {
    const id = row?.id ?? row?.user_id ?? row?.userId ?? row?.userID;
    const email = row?.email ?? row?.user_email ?? row?.userEmail;
    const username = row?.username ?? row?.user_name ?? row?.userName ?? row?.Username;
    const firstname = row?.firstname ?? row?.first_name ?? row?.firstName;
    const lastname = row?.lastname ?? row?.last_name ?? row?.lastName;
    const contactNumber = row?.contactNumber ?? row?.contact_number ?? row?.Contact_number ?? row?.phone ?? row?.phone_number;
    const departmentName = row?.department ?? row?.department_name ?? row?.departmentName ?? row?.dept_name ?? '';
    const departmentCode = row?.department_code ?? row?.dept_code ?? '';
    const department = departmentName || departmentCode;
    const departmentId = row?.department_id ?? row?.departmentId ?? row?.dept_id ?? '';
    const roleVal = row?.role ?? row?.position ?? '';
    const status = row?.status ?? row?.user_status ?? '';
    const updatedAt = row?.updated_at ?? row?.updatedAt ?? row?.updated;
    const profilePic = row?.profilePic ?? row?.profile_pic ?? row?.avatar_url ?? row?.avatar;

    const nameFromParts = `${firstname || ''} ${lastname || ''}`.trim();
    const name = nameFromParts || username || email || 'Unknown';

    return {
      id,
      name,
      email: email || '',
      phone: contactNumber || '',
      department,
      department_id: departmentId,
      role: (roleVal || '').toString().charAt(0).toUpperCase() + (roleVal || '').toString().slice(1).toLowerCase(),
      roleRaw: (roleVal || '').toString().toUpperCase(),
      status: (status || '').toString().charAt(0).toUpperCase() + (status || '').toString().slice(1),
      statusRaw: (status || '').toString().toLowerCase(),
      lastLogin: updatedAt ? new Date(updatedAt).toLocaleDateString() : '',
      profilePic: profilePic || ''
    };
  };

  // Function to fetch users with role-based scoping
  const fetchUsers = async (opts = {}) => {
    const quiet = !!opts.quiet;
    if (!quiet) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      
      // Role-based access control
      if (effectiveIsDean) {
        // Dean: Only see users from their own department
        // Get department from session-based user data - prioritize department_id
        const deanDeptId = currentUser?.department_id;
        const deanDept = currentUser?.department || 
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

        if (deanDeptId) {
          params.append('department_id', deanDeptId);
          // Using department_id for filtering
        } else if (deanDept) {
          params.append('department', deanDept);
          // Using department name for filtering
        } else {
          // No department information available
        }
      } else if (isAdmin) {
        // Admin: Can filter by department if selected
        if (selectedDepartment) {
          params.append('department', selectedDepartment);
        }
      }
      
      if (selectedRole) params.append('role', selectedRole);

      const data = await fetchJson(buildUrl(`users?${params.toString()}`), { method: 'GET' });
      const rows = Array.isArray(data.users) ? data.users : (Array.isArray(data.data) ? data.data : []);
      const mapped = rows.map(normalizeUser);

      // Set users based on role
      if (isAdmin) {
        // Admin sees all users
        setUsers(mapped);
      } else if (effectiveIsDean) {
        // Dean sees only their department users - ADD FRONTEND FILTERING AS BACKUP
        const deanDeptId = currentUser?.department_id;
        const deanDept = currentUser?.department || 
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
        if (deanDeptId || deanDept) {
          // Filter users by department on the frontend as a security measure
          const filteredMapped = mapped.filter(user => {
            const userDeptId = user.department_id;
            const userDept = user.department || user.department_name || user.dept_name || user.college || user.faculty || user.unit || '';
            
            // First try to match by department_id
            if (deanDeptId && userDeptId) {
              if (deanDeptId === userDeptId) {
                return true;
              }
            }
            
            // Then try to match by department name
            if (deanDept && userDept) {
              const userDeptLower = userDept.toString().toLowerCase();
              const deanDeptLower = deanDept.toString().toLowerCase();
              
              // Check for exact match or partial matches
              const isMatch = userDeptLower === deanDeptLower ||
                             userDeptLower.includes(deanDeptLower) ||
                             deanDeptLower.includes(userDeptLower) ||
                             // Handle common abbreviations
                             (deanDeptLower.includes('cbme') && userDeptLower.includes('business')) ||
                             (deanDeptLower.includes('business') && userDeptLower.includes('cbme')) ||
                             (deanDeptLower.includes('cbme') && userDeptLower.includes('management')) ||
                             (deanDeptLower.includes('management') && userDeptLower.includes('cbme'));
              
              
              
              return isMatch;
            }
            
            return false;
          });
          setUsers(filteredMapped);
        } else {
          // If no department info, show no users for security
          setUsers([]);
        }
              } else if (roleLower === 'faculty') {
        // Faculty: show only users in their own department
        const fDeptId = currentUser?.department_id;
        const fDept = currentUser?.department || currentUser?.department_name || currentUser?.dept_name || '';
        const filteredMapped = mapped.filter(user => {
          if (fDeptId && user.department_id) return String(user.department_id) === String(fDeptId);
          if (fDept) return String(user.department || '').toLowerCase().includes(String(fDept).toLowerCase());
          return false;
        });
        setUsers(filteredMapped);
      } else {
        // For other roles, only show self
        const email = (currentUser && (currentUser.email || currentUser.user_email)) || '';
        setUsers(mapped.filter(u => u.email === email));
      }
    } catch (e) {
      setError(e.message);
      setUsers([]);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Soft delete / restore helpers - refetch users after operations
  const refetchUsers = async () => {
    await fetchUsers();
  };

  const updateUserTrashState = async (userId, action) => {
    const data = await fetchJson(buildUrl('users/trash'), {
      method: 'POST',
      body: JSON.stringify({ userId, action })
    });
    if (data.success === false) throw new Error(data.message || 'Request failed');
    return data;
  };

  const bulkPermanentDelete = async (ids) => {
    const data = await fetchJson(buildUrl('users/trash'), {
      method: 'POST',
      body: JSON.stringify({ userIds: ids, action: 'permanent_delete' })
    });
    if (data.success === false) throw new Error(data.message || 'Request failed');
    return data;
  };


  

  const handleRestore = async (user) => {
    if (!user?.id) return;
    if (!window.confirm(`Restore ${user.name || 'this user'} from trash?`)) return;
    try {
      await updateUserTrashState(user.id, 'restore_from_trashcan');
      await refetchUsers();
      alert('User restored.');
    } catch (e) {
      alert(e.message);
    }
  };

// Fetch departments for update modal
const fetchDepartments = async () => {
  try {
    const resp = await fetchJson(buildUrl('departments'), { method: 'GET' });
    let raw = [];
    if (resp && Array.isArray(resp.departments)) raw = resp.departments;
    else if (Array.isArray(resp?.data)) raw = resp.data;
    else if (Array.isArray(resp)) raw = resp;

    // Normalize to { department_id, name, code } with numeric department_id
    const normalized = raw.map((d) => {
      const id = Number(d.department_id ?? d.dept_id ?? d.value);
      const name = d.name ?? d.label ?? '';
      const code = d.code ?? d.dept_code ?? '';
      return { department_id: id, name, code };
    }).filter(d => Number.isFinite(d.department_id));

    setDepartmentOptions(normalized);
  } catch (error) {
    console.error('Error fetching departments:', error);
    setDepartmentOptions([]);
  }
};

  // Open update modal
  function handleUpdateUser(user) {
    setSelectedUser(user);
    setUpdateForm({
      department: effectiveIsDean ? (currentUser?.department_id || '') : (user.department_id || ''),
      role: user.roleRaw || ''
    });
    setShowUpdateModal(true);
    setUpdateError('');
    setUpdateSuccess('');
  }

  function handleCloseModal() {
    setShowUpdateModal(false);
    setSelectedUser(null);
    setUpdateForm({ department: '', role: '' });
    setUpdateError('');
    setUpdateSuccess('');
  }

  // Handle form changes
  function handleFormChange(field, value) {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Submit update
  async function handleSubmitUpdate() {
    if (!selectedUser) return;
    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      // Deans: prevent changing departments (enforce if applicable)
      if (!isAdmin && effectiveIsDean) {
        if (updateForm.department !== (currentUser?.department_id || '')) {
          throw new Error('Deans cannot change user departments');
        }
      }

      if (!updateForm.department || !updateForm.role) {
        throw new Error('Department and role are required');
      }

      // Ensure department_id is numeric
      let deptIdNum = Number(updateForm.department);
      if (!Number.isFinite(deptIdNum)) {
        const needle = String(updateForm.department).toUpperCase();
        const match = (departmentOptions || []).find(opt =>
          (opt.code && String(opt.code).toUpperCase() === needle) ||
          (opt.name && String(opt.name).toUpperCase() === needle)
        );
        if (match?.department_id) {
          deptIdNum = Number(match.department_id);
        }
      }
      if (!Number.isFinite(deptIdNum)) {
        throw new Error('Please select a valid department');
      }

      const body = {
        department_id: deptIdNum,
        role: String(updateForm.role).toUpperCase()
      };

      const data = await fetchJson(buildUrl(`users/${selectedUser.id}`), {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      if (data && data.success) {
        setUpdateSuccess('User updated successfully!');
        setShowUpdateModal(false);
        await refetchUsers();
        setTimeout(() => setUpdateSuccess(''), 3000);
      } else {
        throw new Error(data?.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setUpdateError(err.message || 'Error updating user. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  }

  // Show confirmation modal
  const showConfirmation = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (confirmAction === 'update') {
      await handleSubmitUpdate();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Close confirmation modal
  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Fetch users on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [selectedDepartment, selectedRole, effectiveIsDean, isAdmin, currentUser]);


  // Derive filters from loaded data
  const departments = useMemo(() => [...new Set(users.map(u => u.department).filter(Boolean))], [users]);
  const roles = useMemo(() => [...new Set(users.map(u => u.role).filter(Boolean))], [users]);

  const filteredUsers = users.filter(user => {
    // Exclude admin users
    const userIsAdmin = user.role?.toUpperCase() === 'ADMIN' || user.position?.toUpperCase() === 'ADMIN';
    if (userIsAdmin) return false;
    
    // Apply search filter
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (user.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply department filter
    const matchesDepartment = !selectedDepartment || String(user.department || '').toLowerCase() === String(selectedDepartment || '').toLowerCase();
    
    // Apply role filter
    const matchesRole = !selectedRole || String(user.role || '').toLowerCase() === String(selectedRole || '').toLowerCase();
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    const sorted = [...filteredUsers].sort((a, b) => {
      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      const av = a[key] || '';
      const bv = b[key] || '';
      return av.toString().localeCompare(bv.toString()) * dir;
    });
    return sorted;
  }, [filteredUsers, sortConfig]);

  // Sorting handler toggles direction when the same key is clicked
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    // Reset to first page on sort change for consistency
    setCurrentPage(1);
  };

  // Prefer focus-based refresh + low-frequency background refresh to avoid flicker
  useEffect(() => {
    const onFocus = () => fetchUsers({ quiet: true });
    window.addEventListener('focus', onFocus);
    // Background refresh every 5 minutes
    const interval = setInterval(() => {
      fetchUsers({ quiet: true });
    }, 5 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [selectedDepartment, selectedRole, effectiveIsDean, isAdmin, currentUser]);

  // Realtime: Users socket listeners
  useEffect(() => {
    const includeForDean = (userObj) => {
      const deanDeptId = currentUser?.department_id;
      const deanDept = currentUser?.department || currentUser?.department_name || currentUser?.dept_name || '';
      if (deanDeptId && userObj?.department_id) {
        return String(deanDeptId) === String(userObj.department_id);
      }
      if (deanDept) {
        return String(userObj?.department || '').toLowerCase().includes(String(deanDept).toLowerCase());
      }
      return false;
    };

    const includeForFaculty = (userObj) => {
      const fDeptId = currentUser?.department_id;
      const fDept = currentUser?.department || currentUser?.department_name || currentUser?.dept_name || '';
      if (fDeptId && userObj?.department_id) return String(fDeptId) === String(userObj.department_id);
      if (fDept) return String(userObj?.department || '').toLowerCase().includes(String(fDept).toLowerCase());
      return false;
    };

    const onCreated = (row) => {
      const u = normalizeUser(row || {});
      // Security: only include if viewer is allowed
      if (!isAdmin && effectiveIsDean && !includeForDean(u)) return;
      if (isFaculty && !includeForFaculty(u)) return;
      setUsers((prev) => {
        const exists = prev.some((x) => String(x.id) === String(u.id));
        if (exists) return prev.map((x) => (String(x.id) === String(u.id) ? { ...x, ...u } : x));
        return [u, ...prev];
      });
    };

    const onUpdated = (row) => {
      const u = normalizeUser(row || {});
      setUsers((prev) => {
        const exists = prev.some((x) => String(x.id) === String(u.id));
        if (!exists) {
          // Add if permitted
          if (isAdmin || (effectiveIsDean && includeForDean(u)) || (isFaculty && includeForFaculty(u))) return [u, ...prev];
          return prev;
        }
        let next = prev.map((x) => (String(x.id) === String(u.id) ? { ...x, ...u } : x));
        if (isFaculty) next = next.filter(includeForFaculty);
        if (effectiveIsDean && !isAdmin) next = next.filter(includeForDean);
        return next;
      });
    };

    const onDeleted = (id) => {
      if (id == null) return;
      setUsers((prev) => prev.filter((x) => String(x.id) !== String(id)));
    };

    socket.on('user:created', onCreated);
    socket.on('user:updated', onUpdated);
    socket.on('user:deleted', onDeleted);
    return () => {
      socket.off('user:created', onCreated);
      socket.off('user:updated', onUpdated);
      socket.off('user:deleted', onDeleted);
    };
  }, [isAdmin, effectiveIsDean, currentUser]);

  const totalItems = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Selection helpers (select on current page)
  const isAllSelected = (() => {
    if (paginatedUsers.length === 0) return false;
    const sel = new Set(selectedUsers.map(String));
    return paginatedUsers.every(u => sel.has(String(u.id)));
  })();
  const isAnySelected = selectedUsers.length > 0;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedUsers.map(u => String(u.id)));
      setSelectedUsers(prev => prev.filter(id => !pageIds.has(String(id))));
    } else {
      const pageIds = paginatedUsers.map(u => String(u.id));
      setSelectedUsers(prev => Array.from(new Set([...prev.map(String), ...pageIds])));
    }
  };
  const toggleSelectOne = (id) => {
    const idStr = String(id);
    setSelectedUsers(prev => {
      const has = prev.map(String).includes(idStr);
      return has ? prev.filter(x => String(x) !== idStr) : [...prev, idStr];
    });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedRole, effectiveIsDean, isAdmin, currentUser]);

  // Get sort icon for column headers (icon components, no emojis)
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowDownUp size={14} style={{ marginLeft: 6, color: '#9ca3af' }} />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} style={{ marginLeft: 6, color: '#3b82f6' }} />
      : <ArrowDown size={14} style={{ marginLeft: 6, color: '#3b82f6' }} />;
  };

  // Handle delete click
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    // Ensure only the modern delete modal is shown
    setShowConfirmModal && setShowConfirmModal(false);
    setDeleteType('single');
    setShowDeleteModal(true);
  };

  // Handle soft delete
  const handleSoftDelete = async (user) => {
    if (!user) return;
    
    try {
      // Soft delete: move user to trashcan
      await updateUserTrashState(user.id, 'move_to_trashcan');
      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
                            {effectiveIsDean ? 'Department Users' : 'Users'}
          </h1>
          <p style={styles.subtitle}>
            {isAdmin && 'Admin access: View and manage all users'}
                          {effectiveIsDean && `Dean access: Managing ${currentUser?.department || currentUser?.department_name || 'your department'} users`}
              {!isAdmin && !effectiveIsDean && 'User access: View all users'}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2" style={{
          ...styles.actions,
          ...(isMobile ? {
            flexDirection: 'column',
            gap: '8px',
            width: '100%'
          } : {})
        }}>
          {/* Bulk delete (hidden for non-admin/dean) */}
          {(isAdmin || effectiveIsDean) && (
          <button
            className="btn btn-danger border rounded-pill px-3"
            onClick={async () => {
              if (selectedUsers.length === 0) return;
              const ok = window.confirm(`Permanently delete ${selectedUsers.length} selected user(s)? This cannot be undone.`);
              if (!ok) return;
              try {
                await bulkPermanentDelete(selectedUsers);
                setSelectedUsers([]);
                await fetchUsers();
                showToast('Selected users permanently deleted', 'success');
              } catch (e) {
                showToast(e.message || 'Bulk delete failed', 'error');
              }
            }}
            disabled={selectedUsers.length === 0}
            style={{
              ...(isMobile ? { width: '100%', justifyContent: 'center' } : {}),
              backgroundColor: selectedUsers.length === 0 ? '#f5f5f5' : '#dc2626',
              borderColor: selectedUsers.length === 0 ? '#e5e7eb' : '#dc2626',
              color: selectedUsers.length === 0 ? '#9ca3af' : 'white'
            }}
            title={selectedUsers.length > 0 ? `Delete ${selectedUsers.length} selected` : 'Select rows to delete'}
          >
            Delete Selected
          </button>
          )}
          {(isAdmin || effectiveIsDean) && (
          <button
            className="btn btn-light border rounded-pill px-3"
            onClick={() => {
              const evt = new CustomEvent('open-user-trash');
              window.dispatchEvent(evt);
            }}
            style={{...(isMobile ? {
              width: '100%',
              justifyContent: 'center'
            } : {})}}
          >
            View Trash
          </button>
          )}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-4" style={styles.searchSection}>
        <div style={styles.searchContainer} className="flex-grow-1">
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {isAdmin && (
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)} 
              style={{
                ...styles.filterSelect,
                ...(isMobile ? { width: '249px', fontSize: '14px' } : {})
              }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

      {/* Toast */}
      {toast.visible && (
        <div style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 11000,
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color: '#fff', padding: '12px 16px', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}
          {effectiveIsDean && (
            <div style={styles.deanDept}>
              <span style={styles.deptLabel}>Department:</span>
              <span style={styles.deptValue}>
                {currentUser?.department_id ? getDepartmentName(currentUser.department_id) : currentUser?.department || currentUser?.department_name || 'Unknown'}
              </span>
            </div>
          )}
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={styles.filterSelect}>
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {/* View Trash removed from filter bar to avoid duplicates and to hide from Faculty */}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        <div style={styles.tableContainer}>
          {isMobile ? (
            // Mobile Card Layout
            <div style={styles.mobileCardContainer}>
              {/* Mobile select-all control */}
              {(isAdmin || effectiveIsDean) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={toggleSelectAll}
                    role="checkbox"
                    aria-checked={isAllSelected}
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                    style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isAllSelected ? '#3b82f6' : '#cbd5e1'}`, backgroundColor: isAllSelected ? '#3b82f6' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    {isAllSelected && <FiCheck size={14} color="#fff" />}
                  </button>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Select all</span>
                </div>
              )}
              {paginatedUsers.map(user => (
                <div key={user.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {(isAdmin || effectiveIsDean) && (
                      <button
                        onClick={() => toggleSelectOne(user.id)}
                        role="checkbox"
                        aria-checked={selectedUsers.map(String).includes(String(user.id))}
                        title={selectedUsers.includes(user.id) ? 'Unselect' : 'Select'}
                        style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selectedUsers.map(String).includes(String(user.id)) ? '#3b82f6' : '#cbd5e1'}`, backgroundColor: selectedUsers.map(String).includes(String(user.id)) ? '#3b82f6' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        {selectedUsers.map(String).includes(String(user.id)) && <FiCheck size={14} color="#fff" />}
                      </button>
                      )}
                      <div style={styles.userInfo}>
                        {user.profilePic ? (
                          <img src={user.profilePic} alt="avatar" style={styles.avatarImage} />
                        ) : (
                          <div style={styles.avatar}>{(user.name || '?').charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userPhone}>{user.phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.mobileCardBody}>
                    <div style={styles.mobileInfoRow}>
                      <Envelope style={styles.emailIcon} />
                      <span style={styles.mobileInfoText}>{user.email}</span>
                    </div>
                    <div style={styles.mobileInfoRow}>
                      <span style={styles.mobileLabel}>Department:</span>
                      <span style={styles.mobileInfoText}>{user.department}</span>
                    </div>
                    <div style={styles.mobileInfoRow}>
                      <span style={styles.mobileLabel}>Role:</span>
                      <span style={styles.mobileInfoText}>{user.role}</span>
                    </div>
                  </div>
                  
                  {(isAdmin || effectiveIsDean) && (
                    <div style={styles.mobileCardActions}>
                      <button 
                        style={styles.mobileActionBtn}
                        onClick={() => handleUpdateUser(user)}
                        title="Edit User"
                      >
                        <FiEdit2 style={styles.actionIcon} />
                        Edit
                      </button>
                      <button 
                        style={{...styles.mobileActionBtn, ...styles.mobileDeleteBtn}}
                        onClick={() => handleDeleteClick(user)}
                        title="Delete User"
                      >
                        <FiTrash2 style={styles.actionIcon} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table Layout
            <div style={styles.tableScrollWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    {(isAdmin || effectiveIsDean) && (
                      <th style={{ ...styles.tableHeaderCell, width: 44, textAlign: 'center' }}>
                        <button
                          onClick={toggleSelectAll}
                          role="checkbox"
                          aria-checked={isAllSelected}
                          title={isAllSelected ? 'Deselect all' : 'Select all'}
                          style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isAllSelected ? '#3b82f6' : '#cbd5e1'}`, backgroundColor: isAllSelected ? '#3b82f6' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                        >
                          {isAllSelected && <FiCheck size={14} color="#fff" />}
                        </button>
                      </th>
                    )}
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('name')} style={styles.sortBtn}>Name {getSortIcon('name')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('email')} style={styles.sortBtn}>Email {getSortIcon('email')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('department')} style={styles.sortBtn}>Department {getSortIcon('department')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('role')} style={styles.sortBtn}>Role {getSortIcon('role')}</button></th>
                    {(isAdmin || effectiveIsDean) && <th style={styles.tableHeaderCell}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => (
                    <tr 
                      key={user.id} 
                      style={{
                        ...styles.tableRow,
                        ...(hoveredRow === user.id && styles.tableRowHover)
                      }}
                      onMouseEnter={() => setHoveredRow(user.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {(isAdmin || effectiveIsDean) && (
                        <td style={{ ...styles.tableCell, width: 44, textAlign: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelectOne(user.id); }}
                            role="checkbox"
                            aria-checked={selectedUsers.map(String).includes(String(user.id))}
                            title={selectedUsers.includes(user.id) ? 'Unselect' : 'Select'}
                            style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selectedUsers.map(String).includes(String(user.id)) ? '#3b82f6' : '#cbd5e1'}`, backgroundColor: selectedUsers.map(String).includes(String(user.id)) ? '#3b82f6' : '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >
                            {selectedUsers.map(String).includes(String(user.id)) && <FiCheck size={14} color="#fff" />}
                          </button>
                        </td>
                      )}
                      <td style={styles.tableCell}>
                        <div style={styles.userInfo}>
                          {user.profilePic ? (
                            <img src={user.profilePic} alt="avatar" style={styles.avatarImage} />
                          ) : (
                            <div style={styles.avatar}>{(user.name || '?').charAt(0).toUpperCase()}</div>
                          )}
                          <div>
                            <div style={styles.userName}>{user.name}</div>
                            <div style={styles.userPhone}>{user.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.emailCell}>
                          <Envelope style={styles.emailIcon} />
                          {user.email}
                        </div>
                      </td>
                      <td style={styles.tableCell}>{user.department}</td>
                      <td style={styles.tableCell}>{user.role}</td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button 
                            style={{
                              ...styles.actionBtn,
                              ...(hoveredButton === `edit-${user.id}` && styles.actionBtnHover)
                            }}
                            title="Edit User"
                            onMouseEnter={() => setHoveredButton(`edit-${user.id}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={() => handleUpdateUser(user)}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button 
                            style={{
                              ...styles.actionBtn,
                              ...(hoveredButton === `delete-${user.id}` && styles.actionBtnHover),
                              color: '#dc2626'
                            }}
                            title="Delete User"
                            onMouseEnter={() => setHoveredButton(`delete-${user.id}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            onClick={() => handleDeleteClick(user)}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Deletion</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={styles.closeButton}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.confirmMessage}>
                <div style={styles.confirmIcon}>
                  <ExclamationTriangle size={48} color="#dc2626" />
                </div>
                <h4 style={styles.confirmTitle}>
                  {deleteType === 'single' ? 'Delete User' : `Delete ${selectedUsers.length} Users`}
                </h4>
                <p style={styles.confirmText}>
                  {deleteType === 'single' 
                    ? `Are you sure you want to delete "${userToDelete?.name}"? This user will be moved to trash and can be restored later.`
                    : `Are you sure you want to delete ${selectedUsers.length} selected users? These users will be moved to trash and can be restored later.`
                  }
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteType === 'single') {
                    try {
                      await updateUserTrashState(userToDelete.id, 'move_to_trashcan');
                      await fetchUsers();
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    } catch (error) {
                      console.error('Error deleting user:', error);
                      alert('Failed to delete user');
                    }
                  } else {
                    try {
                      await Promise.all(selectedUsers.map(userId => updateUserTrashState(userId, 'move_to_trashcan')));
                      await fetchUsers();
                      setShowDeleteModal(false);
                      setSelectedUsers([]);
                    } catch (error) {
                      console.error('Error deleting users:', error);
                      alert('Failed to delete users');
                    }
                  }
                }}
                style={styles.confirmButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update User Modal */}
      {showUpdateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update User</h3>
              <button
                onClick={handleCloseModal}
                style={styles.closeButton}
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {selectedUser && (
                <div style={styles.userProfileSection}>
                  <div style={styles.userAvatarLarge}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={styles.userInfoSection}>
                    <div style={styles.userNameLarge}>{selectedUser.name}</div>
                    <div style={styles.userEmailSection}>
                      <Envelope size={16} style={{ color: '#64748b', marginRight: '8px' }} />
                      <span style={styles.userEmailText}>{selectedUser.email}</span>
                    </div>
                    <div style={styles.currentInfoText}>
                      Current: {selectedUser.role} • {selectedUser.department}
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.updateFormSection}>
                <div style={styles.formFieldGroup}>
                  <div style={styles.fieldLabel}>
                    <FiSettings size={16} style={styles.fieldIcon} />
                    <span>Department</span>
                    <span style={styles.requiredAsterisk}>*</span>
                  </div>
                  {(!isAdmin && effectiveIsDean) ? (
                    <div style={styles.readOnlyField}>
                      {currentUser?.department_id ? getDepartmentName(currentUser.department_id) : currentUser?.department || currentUser?.department_name || 'Unknown'}
                    </div>
                  ) : (
                    <select
                      value={updateForm.department}
                      onChange={(e) => handleFormChange('department', e.target.value)}
                      style={styles.modernSelect}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.name} {dept.code && `(${dept.code})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={styles.formFieldGroup}>
                  <div style={styles.fieldLabel}>
                    <FiUser size={16} style={styles.fieldIcon} />
                    <span>Role</span>
                    <span style={styles.requiredAsterisk}>*</span>
                  </div>
                  <select
                    value={updateForm.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    style={styles.modernSelect}
                  >
                    <option value="">Select Role</option>
                    {(!effectiveIsDean || isAdmin) && <option value="ADMIN">Admin</option>}
                    <option value="DEAN">Dean</option>
                    <option value="FACULTY">Faculty</option>
                  </select>
                  <div style={styles.roleDescription}>
                    {updateForm.role === 'FACULTY' && 'Teaching and academic responsibilities'}
                    {updateForm.role === 'DEAN' && 'Administrative and leadership responsibilities'}
                    {updateForm.role === 'ADMIN' && 'System administration and management'}
                  </div>
                </div>
              </div>

              {updateError && (
                <div style={styles.errorMessage}>
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div style={styles.successMessage}>
                  {updateSuccess}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCloseModal}
                style={styles.modernCancelButton}
                disabled={updateLoading}
              >
                <X size={16} style={{ marginRight: '8px' }} />
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdate}
                style={styles.modernUpdateButton}
                disabled={updateLoading || !updateForm.department || !updateForm.role}
              >
                <FiEdit2 size={16} style={{ marginRight: '8px' }} />
                {updateLoading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.pagination}>
        <div style={styles.paginationInfo}>
          Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems} users ({filteredUsers.length} total)
        </div>
        <div style={styles.paginationControls}>
          <button
            style={currentPage === 1 ? styles.paginationBtnDisabled : styles.paginationBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="First Page"
          >
            <FiChevronsLeft size={16} />
          </button>
          <button
            style={currentPage === 1 ? styles.paginationBtnDisabled : styles.paginationBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            title="Previous Page"
          >
            <FiChevronLeft size={16} />
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
                  ...styles.paginationBtn,
                  ...(currentPage === pageNum ? styles.paginationBtnActive : {})
                }}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            style={currentPage === totalPages ? styles.paginationBtnDisabled : styles.paginationBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            title="Next Page"
          >
            <FiChevronRight size={16} />
          </button>
          <button
            style={currentPage === totalPages ? styles.paginationBtnDisabled : styles.paginationBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Last Page"
          >
            <FiChevronsRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  refreshBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#475569',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  searchSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
  },
  filters: {
    display: 'flex',
    gap: '8px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterSelect: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    fontSize: '14px',
    outline: 'none',
  },
  tableContainer: {
    backgroundColor: 'transparent',
    borderRadius: '8px',
    border: 'none',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
    background: 'transparent',
  },
  tableHeader: {
    backgroundColor: 'transparent',
    borderBottom: '1px solid #f3f4f6',
  },
  tableHeaderCell: {
    padding: '20px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: '600',
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6',
  },
  tableRow: {
    borderBottom: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    marginBottom: '12px',
  },
  tableRowHover: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
  },
  tableCell: {
    padding: '18px 14px',
    border: 'none',
    textAlign: 'left',
    fontSize: '14px',
    color: '#374151',
  },
  tableRowFirstCell: {
    borderTopLeftRadius: '20px',
    borderBottomLeftRadius: '20px',
  },
  tableRowLastCell: {
    borderTopRightRadius: '20px',
    borderBottomRightRadius: '20px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    marginRight: '12px',
  },
  avatarImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userName: {
    fontWeight: '500',
    marginBottom: '2px',
  },
  userPhone: {
    fontSize: '12px',
    color: '#64748b',
  },
  emailCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emailIcon: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      color: '#374151',
    }
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '8px 12px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionBtnHover: {
    backgroundColor: '#f8fafc',
    borderColor: '#d1d5db',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    borderTop: '1px solid #e5e7eb',
    marginTop: '16px',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
    padding: '0 8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  paginationBtnHover: {
    background: '#f8fafc',
    borderColor: '#9ca3af',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  paginationBtnActive: {
    background: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
  },
  paginationBtnActiveHover: {
    background: '#2563eb',
    borderColor: '#2563eb',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.4)',
  },
  paginationBtnDisabled: {
    background: '#f9fafb',
    borderColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    marginBottom: '16px',
  },
  summaryInfo: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    minHeight: '300px',
  },
  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
    letterSpacing: '-0.025em',
  },
  emptyStateMessage: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '400',
    maxWidth: '420px',
    lineHeight: '1.5',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  userProfileSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '32px',
    padding: '0',
  },
  userAvatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userInfoSection: {
    flex: 1,
  },
  userNameLarge: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  userEmailSection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  userEmailText: {
    fontSize: '14px',
    color: '#64748b',
  },
  currentInfoText: {
    fontSize: '14px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  updateFormSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  fieldIcon: {
    color: '#64748b',
    width: '16px',
    height: '16px',
    fontSize: '16px',
  },
  requiredAsterisk: {
    color: '#dc2626',
    fontSize: '14px',
  },
  modernSelect: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#374151',
    outline: 'none',
    transition: 'all 0.2s ease',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: '40px',
  },
  readOnlyField: {
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  roleDescription: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '4px',
    minHeight: '16px',
  },
  modernCancelButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modernUpdateButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userInfoDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '18px',
  },
  userDisplayName: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '16px',
  },
  userDisplayEmail: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '2px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none',
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#16a34a',
    fontSize: '14px',
    marginBottom: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  updateButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  confirmMessage: {
    textAlign: 'center',
    padding: '20px 0',
  },
  confirmIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  confirmText: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: 0,
  },
  confirmButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deanDept: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '6px',
    fontSize: '14px',
  },
  deptLabel: {
    color: '#0369a1',
    fontWeight: '500',
  },
  deptValue: {
    color: '#0c4a6e',
    fontWeight: '600',
  },
  deanDeptDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '6px',
    fontSize: '14px',
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
  tableScrollWrapper: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  mobileCardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  mobileCardHeader: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  mobileCardBody: {
    marginBottom: '16px',
  },
  mobileInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  mobileLabel: {
    fontWeight: '600',
    color: '#64748b',
    minWidth: '80px',
  },
  mobileInfoText: {
    color: '#374151',
    flex: 1,
  },
  mobileCardActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  mobileActionBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '44px',
    transition: 'all 0.2s ease',
  },
  mobileDeleteBtn: {
    color: '#dc2626',
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  actionIcon: {
    fontSize: '16px',
  },
  tableMobile: {
    minWidth: '800px',
    fontSize: '13px',
  },
  actionsMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    width: '100%',
  },
};

export default User;
