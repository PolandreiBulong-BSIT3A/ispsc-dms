import React, { useState, useEffect, useMemo } from 'react';
import { ArrowCounterclockwise, Trash2, Search, ExclamationTriangle, X, ArrowDownUp, ArrowUp, ArrowDown, Envelope, Trash } from 'react-bootstrap-icons';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext';

const UserTrash = ({ onBack, currentUser, isAdmin, effectiveIsDean }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [userToRestore, setUserToRestore] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'restore-single', 'restore-bulk', 'delete-single', 'delete-bulk'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
  const roles = [...new Set(users.map(u => u.role).filter(Boolean))];

  const normalizeUser = (row) => {
    const id = row?.id ?? row?.user_id ?? row?.userId ?? row?.userID;
    const email = row?.email ?? row?.user_email ?? row?.userEmail;
    const username = row?.username ?? row?.user_name ?? row?.userName ?? row?.Username;
    const firstname = row?.firstname ?? row?.first_name ?? row?.firstName;
    const lastname = row?.lastname ?? row?.last_name ?? row?.lastName;
    const departmentName = row?.department ?? row?.department_name ?? row?.departmentName ?? row?.dept_name ?? '';
    const departmentCode = row?.department_code ?? row?.dept_code ?? '';
    const profilePic = row?.profilePic ?? row?.profile_pic ?? row?.avatar_url ?? row?.avatar;
    const role = row?.role ?? row?.user_role ?? row?.userRole ?? row?.user_type ?? row?.userType ?? '';
    const nameFromParts = `${firstname || ''} ${lastname || ''}`.trim();
    const name = nameFromParts || username || email || 'Unknown';
    return {
      id,
      name,
      email: email || '',
      department: departmentName || departmentCode || '',
      role: role || 'N/A',
      profilePic: profilePic || ''
    };
  };

  const fetchDeletedUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Build URL with dean scoping if applicable
      const base = 'http://localhost:5000/api/users';
      const qs = new URLSearchParams({ status: 'deleted' });
      if (effectiveIsDean && currentUser) {
        if (currentUser.department_id) {
          qs.append('department_id', String(currentUser.department_id));
        } else if (currentUser.department || currentUser.department_name || currentUser.dept_name) {
          qs.append('department', String(currentUser.department || currentUser.department_name || currentUser.dept_name));
        }
      }
      const response = await fetch(`${base}?${qs.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to load deleted users');
      }
      const rows = Array.isArray(data.users) ? data.users : (Array.isArray(data.data) ? data.data : []);
      const onlyDeleted = rows.filter(r => (r.status || r.user_status || '').toString().toLowerCase() === 'deleted');
      let normalized = onlyDeleted.map(normalizeUser);
      // Client-side dean scoping fallback (in case backend ignores filters)
      if (effectiveIsDean && currentUser) {
        const deanDeptId = currentUser.department_id;
        const deanDeptName = String(currentUser.department || currentUser.department_name || currentUser.dept_name || '').toLowerCase();
        normalized = normalized.filter(u => {
          if (deanDeptId && u.department_id) return String(u.department_id) === String(deanDeptId);
          if (deanDeptName) return String(u.department || '').toLowerCase().includes(deanDeptName);
          return true;
        });
      }
      setUsers(normalized);
      // Reconcile selection with current list
      const currentIds = new Set(normalized.map(u => u.id));
      setSelectedIds(prev => prev.filter(id => currentIds.has(id)));
    } catch (e) {
      setError(e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeletedUsers(); }, []);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeletedUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const restoreUser = async (userId) => {
    const response = await fetch('http://localhost:5000/api/users/trash', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'restore_from_trashcan' })
    });
    const data = await response.json().catch(() => ({ success: false }));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Failed to restore user');
    }
  };

  const permanentlyDeleteUser = async (userId) => {
    const response = await fetch('http://localhost:5000/api/users/trash', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'permanent_delete' })
    });
    const data = await response.json().catch(() => ({ success: false }));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Failed to permanently delete user');
    }
  };

  const restoreSelected = async () => {
    if (selectedIds.length === 0) return;
    const response = await fetch('http://localhost:5000/api/users/trash', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selectedIds, action: 'restore_from_trashcan' })
    });
    const data = await response.json().catch(() => ({ success: false }));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Failed to restore selected users');
    }
  };

  const permanentlyDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const response = await fetch('http://localhost:5000/api/users/trash', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selectedIds, action: 'permanent_delete' })
    });
    const data = await response.json().catch(() => ({ success: false }));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Failed to permanently delete selected users');
    }
  };

  const permanentlyDeleteAll = async () => {
    const response = await fetch('http://localhost:5000/api/users/trash', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'permanent_delete_all' })
    });
    const data = await response.json().catch(() => ({ success: false }));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Failed to permanently delete all deleted users');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedIds(filtered.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleSelect = (id, checked) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const filtered = useMemo(() => {
    const filteredUsers = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
      const matchesRole = !selectedRole || user.role === selectedRole;
      return matchesSearch && matchesDepartment && matchesRole;
    });

    const sorted = [...filteredUsers].sort((a, b) => {
      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      const av = a[key] || '';
      const bv = b[key] || '';
      return av.toString().localeCompare(bv.toString()) * dir;
    });
    
    return sorted;
  }, [users, searchTerm, selectedDepartment, selectedRole, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginatedUsers = filtered.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedRole]);

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
      ? <ArrowUp size={14} style={{ marginLeft: 6, color: '#3b82f6' }} />
      : <ArrowDown size={14} style={{ marginLeft: 6, color: '#3b82f6' }} />;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {effectiveIsDean ? 'Department Deleted Users' : 'Deleted Users'}
          </h1>
          <p style={styles.subtitle}>
            {isAdmin && 'Admin access: View and manage deleted users'}
            {effectiveIsDean && `Dean access: Managing deleted ${currentUser?.department || currentUser?.department_name || 'your department'} users`}
            {!isAdmin && !effectiveIsDean && 'User access: View deleted users'}
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
          {selectedIds.length > 0 && (
            <button
              className="btn btn-warning btn-sm border rounded-pill"
              onClick={() => {
                setActionType('restore');
                setShowRestoreModal(true);
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '14px',
                padding: '6px 12px',
                ...(isMobile ? {
                  width: '100%',
                  justifyContent: 'center'
                } : {})
              }}
            >
              <ArrowCounterclockwise />
              Restore Selected ({selectedIds.length})
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm border rounded-pill"
              onClick={() => {
                setActionType('delete');
                setShowDeleteModal(true);
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '14px',
                padding: '6px 12px',
                ...(isMobile ? {
                  width: '100%',
                  justifyContent: 'center'
                } : {})
              }}
            >
              <Trash />
              Delete Permanently ({selectedIds.length})
            </button>
          )}
          {effectiveIsDean && (
            <button 
              style={{
                ...styles.refreshBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                ...(isMobile ? {
                  width: '100%',
                  justifyContent: 'center'
                } : {})
              }}
              onClick={fetchDeletedUsers}
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🔄 Force Refresh'}
            </button>
          )}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-4" style={styles.searchSection}>
        <div style={{
          ...styles.searchContainer,
          ...(isMobile ? { width: '100%', minWidth: 'unset' } : {})
        }} className={isMobile ? 'w-100' : 'flex-grow-1'}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...styles.searchInput,
              ...(isMobile ? { borderRadius: '20px' } : {})
            }}
          />
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center" style={isMobile ? { width: '100%', justifyContent: 'space-between' } : {}}>
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
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)} 
            style={{
              ...styles.filterSelect,
              ...(isMobile ? { flex: '1 1 auto', minWidth: '100px' } : {})
            }}
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            className="btn btn-light border rounded-pill px-3"
            onClick={onBack}
            style={isMobile ? { flex: '1 1 auto', minWidth: '100px', justifyContent: 'center' } : {}}
          >
            View Active Users
          </button>
        </div>
      </div>
      {loading ? (
        <div style={styles.loading}>Loading deleted users...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        <div style={styles.tableContainer}>
          {isMobile ? (
            // Mobile Card Layout
            <div style={styles.mobileCardContainer}>
              {paginatedUsers.map(user => (
                <div key={user.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
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
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }}>
                      Deleted
                    </span>
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
                      <span style={styles.mobileInfoText}>{user.role || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div style={styles.mobileCardActions}>
                    <button 
                      style={styles.mobileActionBtn}
                      onClick={() => {
                        setActionType('restore-single');
                        setSelectedIds([user.id]);
                        setShowRestoreModal(true);
                      }}
                      title="Restore User"
                    >
                      <ArrowCounterclockwise style={styles.actionIcon} />
                      Restore
                    </button>
                    <button 
                      style={{...styles.mobileActionBtn, ...styles.mobileDeleteBtn}}
                      onClick={() => {
                        setActionType('delete-single');
                        setSelectedIds([user.id]);
                        setShowDeleteModal(true);
                      }}
                      title="Permanently Delete User"
                    >
                      <Trash style={styles.actionIcon} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table Layout
            <div style={styles.tableScrollWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableHeaderCell}>
                      <div
                        style={{
                          ...styles.checkbox,
                          ...(selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0 ? styles.checkboxChecked : {})
                        }}
                        onClick={() => handleSelectAll(selectedIds.length !== paginatedUsers.length)}
                        title={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0 ? 'Deselect all' : 'Select all'}
                      >
                        {(selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                    </th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('name')} style={styles.sortBtn}>Name {getSortIcon('name')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('email')} style={styles.sortBtn}>Email {getSortIcon('email')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('department')} style={styles.sortBtn}>Department {getSortIcon('department')}</button></th>
                    <th style={styles.tableHeaderCell}><button onClick={() => handleSort('role')} style={styles.sortBtn}>Role {getSortIcon('role')}</button></th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u, index) => (
              <tr 
                key={u.id} 
                style={{
                  ...styles.tableRow,
                  ...(hoveredRow === u.id && styles.tableRowHover)
                }}
                onMouseEnter={() => setHoveredRow(u.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td style={{...styles.tableCell, ...styles.tableRowFirstCell}}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(selectedIds.includes(u.id) ? styles.checkboxChecked : {})
                    }}
                    onClick={() => handleSelect(u.id, !selectedIds.includes(u.id))}
                  >
                    {selectedIds.includes(u.id) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.userInfo}>
                      {u.profilePic ? (
                        <img src={u.profilePic} alt="avatar" style={styles.avatarImage} />
                      ) : (
                        <div style={styles.avatar}>{(u.name || '?').charAt(0)}</div>
                      )}
                    <div>
                      <div style={styles.userName}>{u.name}</div>
                      <div style={styles.userPhone}>{u.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.emailCell}>
                    <Envelope style={styles.emailIcon} />
                    {u.email}
                  </div>
                </td>
                <td style={styles.tableCell}>{u.department}</td>
                <td style={styles.tableCell}>{u.role || 'N/A'}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: '#fee2e2',
                    color: '#dc2626'
                  }}>
                    Deleted
                  </span>
                </td>
                <td style={{...styles.tableCell, ...styles.tableRowLastCell}}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    ...(isMobile ? {
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    } : {
                      flexDirection: 'row'
                    })
                  }}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...(isMobile ? {
                          width: '100%',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          fontSize: '14px'
                        } : {})
                      }}
                      onClick={() => {
                        setActionType('restore-single');
                        setSelectedIds([u.id]);
                        setShowRestoreModal(true);
                      }}
                      title="Restore" aria-label="Restore"
                    >
                      <ArrowCounterclockwise size={14} />
                      {isMobile && <span style={{ marginLeft: '8px' }}>Restore</span>}
                    </button>
                    <button
                      style={{
                        ...styles.actionBtn, 
                        ...styles.deleteBtn,
                        ...(isMobile ? {
                          width: '100%',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          fontSize: '14px'
                        } : {})
                      }}
                      onClick={() => {
                        setActionType('delete-single');
                        setSelectedIds([u.id]);
                        setShowDeleteModal(true);
                      }}
                      title="Delete Permanently" aria-label="Delete"
                    >
                      <Trash2 size={14} />
                      {isMobile && <span style={{ marginLeft: '8px' }}>Delete</span>}
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

      {/* Pagination */}
      {filtered.length > 0 && (
        <div style={styles.pagination}>
          <div style={styles.paginationInfo}>
            Showing {filtered.length === 0 ? 0 : startIndex + 1}-{endIndex} of {filtered.length} deleted users
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
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Restoration</h3>
              <button
                onClick={() => setShowRestoreModal(false)}
                style={styles.closeButton}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.confirmMessage}>
                <div style={styles.confirmIcon}>
                  <ArrowCounterclockwise size={48} color="#f59e0b" />
                </div>
                <h4 style={styles.confirmTitle}>
                  {actionType === 'restore-single' ? 'Restore User' : `Restore ${selectedIds.length} Users`}
                </h4>
                <p style={styles.confirmText}>
                  {actionType === 'restore-single' 
                    ? 'Are you sure you want to restore this user? The user will be moved back to the active users list.'
                    : `Are you sure you want to restore ${selectedIds.length} selected users? These users will be moved back to the active users list.`
                  }
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowRestoreModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (actionType === 'restore-single') {
                      await restoreUser(selectedIds[0]);
                    } else {
                      await restoreSelected();
                    }
                    await fetchDeletedUsers();
                    setSelectedIds([]);
                    setShowRestoreModal(false);
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                style={{
                  ...styles.confirmButton,
                  backgroundColor: '#f59e0b',
                  borderColor: '#f59e0b'
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Permanent Deletion</h3>
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
                  {actionType === 'delete-single' ? 'Permanently Delete User' : `Permanently Delete ${selectedIds.length} Users`}
                </h4>
                <p style={styles.confirmText}>
                  {actionType === 'delete-single' 
                    ? '⚠️ Are you sure you want to permanently delete this user? This action cannot be undone and all user data will be lost forever.'
                    : `⚠️ Are you sure you want to permanently delete ${selectedIds.length} selected users? This action cannot be undone and all user data will be lost forever.`
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
                  try {
                    if (actionType === 'delete-single') {
                      await permanentlyDeleteUser(selectedIds[0]);
                    } else {
                      await permanentlyDeleteSelected();
                    }
                    await fetchDeletedUsers();
                    setSelectedIds([]);
                    setShowDeleteModal(false);
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                style={styles.confirmButton}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrash;

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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    fontSize: '14px',
    outline: 'none',
  },
  tableContainer: {
    backgroundColor: 'transparent',
    borderRadius: '8px',
    borderWidth: '0',
    borderStyle: 'none',
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
    borderWidth: '0',
    borderStyle: 'none',
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
    borderWidth: '0',
    borderStyle: 'none',
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
    backgroundColor: '#6366f1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
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
    borderWidth: '0',
    borderStyle: 'none',
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
    borderTopColor: '#d1d5db',
    borderRightColor: '#d1d5db',
    borderBottomColor: '#d1d5db',
    borderLeftColor: '#d1d5db',
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
    borderRadius: '8px',
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
    borderWidth: '0',
    borderStyle: 'none',
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
    backgroundColor: '#6366f1',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none',
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#bbf7d0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  updateButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    borderWidth: '0',
    borderStyle: 'none',
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
    borderWidth: '0',
    borderStyle: 'none',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#0ea5e9',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#0ea5e9',
    borderRadius: '6px',
    fontSize: '14px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderTopColor: '#d1d5db',
    borderRightColor: '#d1d5db',
    borderBottomColor: '#d1d5db',
    borderLeftColor: '#d1d5db',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxHover: {
    borderTopColor: '#3b82f6',
    borderRightColor: '#3b82f6',
    borderBottomColor: '#3b82f6',
    borderLeftColor: '#3b82f6',
    background: '#f0f9ff',
  },
  checkboxChecked: {
    borderTopColor: '#3b82f6',
    borderRightColor: '#3b82f6',
    borderBottomColor: '#3b82f6',
    borderLeftColor: '#3b82f6',
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
