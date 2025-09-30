import React, { useEffect, useMemo, useState } from 'react';
import { Envelope, Search, Funnel } from 'react-bootstrap-icons';
import { FiX, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext';

const TrashUser = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { user: currentUser } = useUser();

  const roleLower = (role || currentUser?.role || '').toString().toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'administrator';
      const isDean = roleLower === 'dean';
      const effectiveIsDean = isDean || (currentUser?.role === 'DEAN' || currentUser?.role === 'dean');

  const normalizeUser = (row) => {
    const id = row?.id ?? row?.user_id ?? row?.userId ?? row?.userID;
    const email = row?.email ?? row?.user_email ?? row?.userEmail;
    const username = row?.username ?? row?.user_name ?? row?.userName ?? row?.Username;
    const firstname = row?.firstname ?? row?.first_name ?? row?.firstName;
    const lastname = row?.lastname ?? row?.last_name ?? row?.lastName;
    const departmentName = row?.department ?? row?.department_name ?? row?.departmentName ?? row?.dept_name ?? '';
    const roleVal = row?.role ?? row?.position ?? '';
    const status = row?.status ?? row?.user_status ?? '';

    const nameFromParts = `${firstname || ''} ${lastname || ''}`.trim();
    const name = nameFromParts || username || email || 'Unknown';

    return {
      id,
      name,
      email: email || '',
      department: departmentName,
      role: (roleVal || '').toString().charAt(0).toUpperCase() + (roleVal || '').toString().slice(1).toLowerCase(),
      status: (status || '').toString().charAt(0).toUpperCase() + (status || '').toString().slice(1),
    };
  };

  const fetchDeletedUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('status', 'deleted');
      
      if (effectiveIsDean && currentUser?.department_id) {
        params.append('department_id', currentUser.department_id);
      }

      const response = await fetch(`http://localhost:5000/api/users?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to load deleted users');
      }
      const rows = Array.isArray(data.users) ? data.users : [];
      setUsers(rows.map(normalizeUser));
    } catch (e) {
      setError(e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (user) => {
    setSelectedUser(user);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedUser) return;
    
    setRestoreLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/trash', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, action: 'restore_from_trashcan' })
      });
      
      if (response.ok) {
        await fetchDeletedUsers();
        setShowRestoreModal(false);
        setSelectedUser(null);
      } else {
        throw new Error('Failed to restore user');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
    setSelectedUser(null);
  };

  const handlePermanentDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedUser) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchDeletedUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        throw new Error('Failed to permanently delete user');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    fetchDeletedUsers();
  }, [currentUser]);

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Trash - Deleted Users</h1>
          <p style={styles.subtitle}>
            {isAdmin && 'Manage deleted users across all departments'}
                          {effectiveIsDean && 'Managing deleted users in your department'}
          </p>
        </div>
        <button onClick={fetchDeletedUsers} style={styles.refreshBtn}>
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search deleted users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>⏳</div>
            <div style={styles.emptyStateTitle}>Loading Deleted Users</div>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>⚠️</div>
            <div style={styles.emptyStateTitle}>Failed to Load</div>
            <div style={styles.emptyStateMessage}>{error}</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🗑️</div>
            <div style={styles.emptyStateTitle}>No Deleted Users Found</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Department</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatar}>{user.name.charAt(0)}</div>
                      <div style={styles.userName}>{user.name}</div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.emailCell}>
                      <Envelope style={styles.emailIcon} />
                      {user.email}
                    </div>
                  </td>
                  <td style={styles.tableCell}>{user.department || 'No Department'}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.roleBadge}>{user.role}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.statusBadge}>{user.status}</span>
                  </td>
                                     <td style={styles.tableCell}>
                     <div style={styles.actionButtons}>
                       <button
                         style={styles.restoreButton}
                         onClick={() => handleRestore(user)}
                         title="Restore User"
                       >
                         <FiRotateCcw />
                       </button>
                       <button
                         style={styles.deleteButton}
                         onClick={() => handlePermanentDelete(user)}
                         title="Permanently Delete User"
                       >
                         <FiTrash2 />
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRestoreModal && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Restore User</h3>
              <button onClick={cancelRestore} style={styles.closeButton}>
                <FiX size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.confirmMessage}>
                <div style={styles.confirmIcon}>🔄</div>
                <div style={styles.confirmTitle}>Restore User Account</div>
                <div style={styles.confirmText}>
                  Are you sure you want to restore <strong>{selectedUser.name}</strong>? 
                  This will reactivate their account.
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={cancelRestore} style={styles.cancelButton}>
                Cancel
              </button>
              <button 
                onClick={confirmRestore} 
                style={styles.restoreConfirmButton}
                disabled={restoreLoading}
              >
                {restoreLoading ? 'Restoring...' : 'Restore User'}
              </button>
            </div>
          </div>
                 </div>
       )}

       {/* Permanent Delete Confirmation Modal */}
       {showDeleteModal && selectedUser && (
         <div style={styles.modalOverlay}>
           <div style={styles.modal}>
             <div style={styles.modalHeader}>
               <h3 style={styles.modalTitle}>Permanently Delete User</h3>
               <button onClick={cancelDelete} style={styles.closeButton}>
                 <FiX size={20} />
               </button>
             </div>
             <div style={styles.modalBody}>
               <div style={styles.confirmMessage}>
                 <div style={styles.confirmIcon}>⚠️</div>
                 <div style={styles.confirmTitle}>Permanently Delete User Account</div>
                 <div style={styles.confirmText}>
                   <strong>WARNING:</strong> This action cannot be undone. 
                   Are you sure you want to permanently delete <strong>{selectedUser.name}</strong>?
                 </div>
                 <div style={styles.warningBox}>
                   <strong>This will:</strong>
                   <ul>
                     <li>Permanently remove the user account</li>
                     <li>Delete all associated data</li>
                     <li>Cannot be recovered</li>
                   </ul>
                 </div>
               </div>
             </div>
             <div style={styles.modalFooter}>
               <button onClick={cancelDelete} style={styles.cancelButton}>
                 Cancel
               </button>
               <button 
                 onClick={confirmPermanentDelete} 
                 style={styles.deleteConfirmButton}
                 disabled={deleteLoading}
               >
                 {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

const styles = {
  container: { padding: '24px' },
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
  refreshBtn: {
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
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  tableHeaderCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#1e293b',
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
  userName: {
    fontWeight: '500',
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
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  restoreButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#10b981',
    fontSize: '14px',
  },
  deleteButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#dc2626',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    minHeight: '400px',
  },
  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  emptyStateMessage: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '400',
    maxWidth: '400px',
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
    borderRadius: '16px',
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
  restoreConfirmButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteConfirmButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  },
  warningBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#dc2626',
  },
};

export default TrashUser;
