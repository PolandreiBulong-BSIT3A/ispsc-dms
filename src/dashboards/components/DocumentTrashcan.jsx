import React, { useEffect, useMemo, useState } from 'react';
import { useDocuments } from '../../contexts/DocumentContext';
import { useUser } from '../../contexts/UserContext';
import { ArrowCounterclockwise, Trash, ArrowDownUp, ChevronUp, ChevronDown } from 'react-bootstrap-icons';

const DocumentTrashcan = ({ onBack }) => {
  const { fetchDeletedDocuments, restoreDocument, permanentlyDeleteDocument } = useDocuments();
  const { hasAdminPrivileges } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletedDocs, setDeletedDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [confirmModal, setConfirmModal] = useState({ open: false, mode: null, doc: null });
  const [propsModal, setPropsModal] = useState({ open: false, doc: null });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const deleted = await fetchDeletedDocuments();
        const normalized = (deleted || [])
          .filter(d => (d.status || '').toString().toLowerCase() === 'deleted' || d.deleted === 1)
          .map(d => ({ ...d, id: d.id || d.doc_id }));
        setDeletedDocs(normalized);
      } catch (e) {
        setError(e?.message || 'Failed to load trash');
      } finally {
        setLoading(false);
      }
    };

  const openProps = (doc) => setPropsModal({ open: true, doc });
  const closeProps = () => setPropsModal({ open: false, doc: null });
    load();
  }, [fetchDeletedDocuments]);

  const filtered = useMemo(() => {
    const base = (() => {
      if (!search.trim()) return deletedDocs;
      const s = search.toLowerCase();
      return deletedDocs.filter(d =>
        d.title?.toLowerCase().includes(s) ||
        d.reference?.toLowerCase().includes(s) ||
        d.from_field?.toLowerCase().includes(s) ||
        d.to_field?.toLowerCase().includes(s) ||
        d.doc_type?.toLowerCase().includes(s) ||
        d.created_by_name?.toLowerCase().includes(s) ||
        d.department_names?.toLowerCase().includes(s)
      );
    })();
    if (!sortConfig.key) return base;
    const sorted = [...base].sort((a, b) => {
      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      const av = a[key] || '';
      const bv = b[key] || '';
      if (key.includes('date') || key.includes('created_at') || key.includes('updated_at')) {
        return (new Date(av) - new Date(bv)) * dir;
      }
      return av.toString().localeCompare(bv.toString()) * dir;
    });
    return sorted;
  }, [deletedDocs, search, sortConfig]);

  const getInitials = (text) => {
    const t = (text || '').toString().trim();
    if (!t) return 'U';
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortIcon = (key) => {
    const baseStyle = { marginLeft: 6, verticalAlign: 'middle' };
    if (sortConfig.key !== key) return <ArrowDownUp size={14} style={baseStyle} />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={16} style={baseStyle} />
      : <ChevronDown size={16} style={baseStyle} />;
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedDocs(filtered.map(d => d.id));
    else setSelectedDocs([]);
  };

  const handleSelect = (id, checked) => {
    if (checked) setSelectedDocs(prev => [...prev, id]);
    else setSelectedDocs(prev => prev.filter(x => x !== id));
  };

  const handleRestore = async (doc) => {
    setConfirmModal({ open: true, mode: 'restore', doc });
  };

  const handlePermanentDelete = async (doc) => {
    if (!hasAdminPrivileges()) return;
    setConfirmModal({ open: true, mode: 'delete', doc });
  };

  const runToast = (message, bg = '#10b981') => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:20px;right:20px;padding:10px 14px;border-radius:8px;color:#fff;font-weight:600;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.15);';
      el.style.background = bg;
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
    } catch {}
  };

  const confirmAction = async () => {
    const { mode, doc } = confirmModal;
    if (!doc) return;
    const id = doc.id || doc.doc_id;
    try {
      if (mode === 'restore') {
        await restoreDocument(id);
        setDeletedDocs(prev => prev.filter(d => (d.id || d.doc_id) !== id));
        setSelectedDocs(prev => prev.filter(x => x !== id));
        runToast('✅ Document restored');
      } else if (mode === 'delete') {
        await permanentlyDeleteDocument(id);
        setDeletedDocs(prev => prev.filter(d => (d.id || d.doc_id) !== id));
        setSelectedDocs(prev => prev.filter(x => x !== id));
        runToast('🗑️ Document permanently deleted', '#ef4444');
      }
    } finally {
      setConfirmModal({ open: false, mode: null, doc: null });
    }
  };

  const closeConfirm = () => setConfirmModal({ open: false, mode: null, doc: null });

  const handleRestoreSelected = async () => {
    if (selectedDocs.length === 0) return;
    for (const id of selectedDocs) {
      await restoreDocument(id);
    }
    setDeletedDocs(prev => prev.filter(d => !selectedDocs.includes(d.id || d.doc_id)));
    setSelectedDocs([]);
  };

  const handlePermanentDeleteSelected = async () => {
    if (!hasAdminPrivileges()) return;
    if (selectedDocs.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedDocs.length} document(s)? This cannot be undone.`)) return;
    for (const id of selectedDocs) {
      await permanentlyDeleteDocument(id);
    }
    setDeletedDocs(prev => prev.filter(d => !selectedDocs.includes(d.id || d.doc_id)));
    setSelectedDocs([]);
  };

  if (loading) return <div>Loading Trash...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1>Trash</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search deleted documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {selectedDocs.length > 0 && (
            <>
              <button
                className="btn btn-light btn-sm border rounded-pill"
                onClick={handleRestoreSelected}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px' }}
              >
                <ArrowCounterclockwise /> Restore Selected ({selectedDocs.length})
              </button>
              {hasAdminPrivileges() && (
                <button
                  className="btn btn-danger btn-sm border rounded-pill"
                  onClick={handlePermanentDeleteSelected}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px' }}
                >
                  <Trash /> Delete Permanently
                </button>
              )}
            </>
          )}
          <button onClick={() => (onBack ? onBack() : null)} className="btn btn-primary rounded-pill px-3">View Documents</button>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>
              <div
                style={{
                  ...styles.checkbox,
                  ...(selectedDocs.length === filtered.length && filtered.length > 0 ? styles.checkboxChecked : {})
                }}
                onClick={() => handleSelectAll(!(selectedDocs.length === filtered.length && filtered.length > 0))}
              >
                {(selectedDocs.length === filtered.length && filtered.length > 0) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
            </th>
            <th style={styles.th}><button onClick={() => handleSort('title')} style={styles.sortBtn}>File Name {sortIcon('title')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('deleted_by_name')} style={styles.sortBtn}>Deleted By {sortIcon('deleted_by_name')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('created_at')} style={styles.sortBtn}>Date Created {sortIcon('created_at')}</button></th>
            <th style={styles.th}><button onClick={() => handleSort('updated_at')} style={styles.sortBtn}>Last Updated {sortIcon('updated_at')}</button></th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(doc => (
            <tr key={doc.id} style={styles.tableRow}>
              <td style={{ ...styles.td, ...styles.tableRowFirstCell }}>
                <div
                  style={{
                    ...styles.checkbox,
                    ...(selectedDocs.includes(doc.id) ? styles.checkboxChecked : {})
                  }}
                  onClick={() => handleSelect(doc.id, !selectedDocs.includes(doc.id))}
                >
                  {selectedDocs.includes(doc.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
              </td>
              <td style={{...styles.td, paddingRight: 0}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  <div style={styles.avatarWrap}>
                    {doc.created_by_profile_pic ? (
                      <img src={doc.created_by_profile_pic} alt="avatar" style={styles.avatarImg} />
                    ) : (
                      <div style={styles.avatarMono}>{getInitials(doc.created_by_name || doc.title)}</div>
                    )}
                  </div>
                  {/* Title + meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={styles.titleRow}>
                      <span 
                        title={doc.title}
                        style={styles.titleLink}
                        onClick={() => openProps(doc)}
                      >
                        {doc.title || '-'}
                      </span>
                      <span style={{...styles.typeTag, background:'#3b82f6'}}>{String(doc.doc_type || '').toString() || 'DOC'}</span>
                    </div>
                    <div style={styles.metaRow}>
                      <span style={styles.metaText}>Created by: {doc.created_by_name || '-'}</span>
                      {doc.deleted_by_name && (
                        <span style={styles.metaDot}>•</span>
                      )}
                      {doc.deleted_by_name && (
                        <span style={{...styles.metaText, color:'#dc2626'}}>Deleted by: {doc.deleted_by_name}</span>
                      )}
                    </div>
                    {doc.department_names && (
                      <div style={styles.badgesRow}>
                        {String(doc.department_names)
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                          .slice(0, 6)
                          .map((name, idx) => (
                            <span key={idx} style={styles.deptBadge}>{name}</span>
                          ))}
                        {String(doc.department_names).split(',').filter(Boolean).length > 6 && (
                          <span style={{...styles.deptBadge, background:'#9ca3af'}}>+{String(doc.department_names).split(',').filter(Boolean).length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={styles.avatarWrapSm}>
                    {doc.deleted_by_profile_pic ? (
                      <img src={doc.deleted_by_profile_pic} alt="avatar" style={styles.avatarImgSm} />
                    ) : (
                      <div style={styles.avatarMonoSm}>{getInitials(doc.deleted_by_name)}</div>
                    )}
                  </div>
                  <span>{doc.deleted_by_name || '-'}</span>
                </div>
              </td>
              <td style={styles.td}>{doc.created_at ? (doc.created_at.split('T')[0] || doc.created_at) : '-'}</td>
              <td style={styles.td}>{doc.updated_at ? (doc.updated_at.split('T')[0] || doc.updated_at) : '-'}</td>
              <td style={{ ...styles.td, ...styles.tableRowLastCell }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-light btn-sm border rounded-circle" onClick={() => handleRestore(doc)} title="Restore" aria-label="Restore"><ArrowCounterclockwise /></button>
                    {hasAdminPrivileges() && (
                      <button className="btn btn-light btn-sm border text-danger rounded-circle" onClick={() => handlePermanentDelete(doc)} title="Delete Permanently" aria-label="Delete"><Trash /></button>
                    )}
                  </div>
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    <button onClick={(e) => {
                      const current = e.currentTarget.nextSibling;
                      if (current) current.style.display = current.style.display === 'block' ? 'none' : 'block';
                    }} className="btn btn-link btn-sm" style={{ textDecoration: 'none' }} title="Details">⋮</button>
                    <div style={{ ...styles.menu, display: 'none', right: 0 }}>
                      <div style={{fontWeight: 600, marginBottom: 8}}>Details</div>
                      <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap: '6px 10px', fontSize: 12, color: '#555'}}>
                        <div><strong>Reference</strong></div><div>{doc.reference || '-'}</div>
                        <div><strong>Sender</strong></div><div>{doc.from_field || '-'}</div>
                        <div><strong>Recipient</strong></div><div>{doc.to_field || '-'}</div>
                        <div><strong>Category</strong></div><div>{doc.doc_type || '-'}</div>
                        <div><strong>Departments</strong></div><div>{doc.department_names || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div style={{ marginTop: 12, color: '#666' }}>No deleted documents found.</div>
      )}

      {confirmModal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }} onClick={closeConfirm}>
          <div style={{ background:'#fff', borderRadius:12, width:'min(520px, 90vw)', padding:20, boxShadow:'0 12px 32px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ margin:0 }}>{confirmModal.mode === 'restore' ? 'Restore Document' : 'Delete Permanently'}</h3>
              <button onClick={closeConfirm} className="btn btn-light btn-sm">✕</button>
            </div>
            <div style={{ color:'#374151', marginBottom:16 }}>
              {confirmModal.mode === 'restore' ? (
                <>
                  Are you sure you want to restore <strong>{confirmModal.doc?.title || 'this document'}</strong>?
                </>
              ) : (
                <>
                  This will permanently delete <strong>{confirmModal.doc?.title || 'this document'}</strong>. This action cannot be undone.
                </>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={closeConfirm} className="btn btn-light">Cancel</button>
              {confirmModal.mode === 'restore' ? (
                <button onClick={confirmAction} className="btn btn-primary">Restore</button>
              ) : (
                <button onClick={confirmAction} className="btn btn-danger">Delete Permanently</button>
              )}
            </div>
          </div>
        </div>
      )}

      {propsModal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }} onClick={closeProps}>
          <div style={{ background:'#fff', borderRadius:12, width:'min(820px, 96vw)', maxHeight:'88vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Document Properties</div>
              <button onClick={closeProps} className="btn btn-light btn-sm">✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                <div>
                  <div style={styles.propLabel}>Title</div>
                  <div style={styles.propValue}>{propsModal.doc?.title || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Reference</div>
                  <div style={styles.propValue}>{propsModal.doc?.reference || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>From</div>
                  <div style={styles.propValue}>{propsModal.doc?.from_field || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>To</div>
                  <div style={styles.propValue}>{propsModal.doc?.to_field || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Type</div>
                  <div style={styles.propValue}>{String(propsModal.doc?.doc_type || '') || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Deleted By</div>
                  <div style={styles.propValue}>{propsModal.doc?.deleted_by_name || '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Date Created</div>
                  <div style={styles.propValue}>{propsModal.doc?.created_at ? (propsModal.doc.created_at.split('T')[0] || propsModal.doc.created_at) : '-'}</div>
                </div>
                <div>
                  <div style={styles.propLabel}>Deleted At</div>
                  <div style={styles.propValue}>{propsModal.doc?.deleted_at ? (new Date(propsModal.doc.deleted_at).toLocaleString()) : '-'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={styles.propLabel}>Departments</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {String(propsModal.doc?.department_names || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map((name, idx) => (
                        <span key={idx} style={styles.deptBadge}>{name}</span>
                      ))}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={styles.propLabel}>Description</div>
                  <div style={styles.propValue}>{propsModal.doc?.description || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    width: '280px'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
    background: 'transparent'
  },
  th: {
    padding: '16px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: 600,
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'left',
    borderBottom: '1px solid #f3f4f6'
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: '#6b7280',
    fontWeight: 600,
  },
  td: {
    padding: '16px 12px',
    border: 'none',
    textAlign: 'left',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#374151'
  },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 36, height: 36, borderRadius: '50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#1f2937' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  titleLink: { fontSize: 16, fontWeight: 600, color: '#1f2937', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  typeTag: { marginLeft: 6, fontSize: 10, color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 600 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 12 },
  metaText: { color: '#6b7280' },
  metaDot: { color: '#9ca3af' },
  badgesRow: { display:'flex', flexWrap:'wrap', gap:6 },
  deptBadge: { background:'#e0e7ff', color:'#1e40af', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600 },
  propLabel: { fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:4 },
  propValue: { fontSize:14, color:'#111827', wordBreak:'break-word' },
  // Profile avatar styles (match Documents list)
  avatarWrap: { width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarImg: { width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' },
  avatarMono: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#111827', background:'#f3f4f6' },
  avatarWrapSm: { width:28, height:28, borderRadius:'50%', background:'#fff', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarImgSm: { width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' },
  avatarMonoSm: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#111827', background:'#f3f4f6' },
  tableRow: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  tableRowFirstCell: {
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px'
  },
  tableRowLastCell: {
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px'
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
    justifyContent: 'center'
  },
  checkboxChecked: {
    borderColor: '#3b82f6',
    background: '#3b82f6',
    color: '#fff'
  },
  menu: { position: 'absolute', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, zIndex: 1000, minWidth: 280, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }
};

export default DocumentTrashcan;


