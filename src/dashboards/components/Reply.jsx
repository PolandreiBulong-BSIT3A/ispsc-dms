import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';

const Reply = ({ onNavigateToDocuments }) => {
  const [replyTitle, setReplyTitle] = useState('');
  const [replyDescription, setReplyDescription] = useState('');
  const [replyLink, setReplyLink] = useState('');
  const [fromField, setFromField] = useState('');
  const [toField, setToField] = useState('');
  const [dateTimeReceived, setDateTimeReceived] = useState('');
  const [sourceDocumentId, setSourceDocumentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);

  // Get source document ID from URL parameters or sessionStorage
  useEffect(() => {
    // First try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('replyTo') || urlParams.get('docId') || urlParams.get('id');
    
    // If not in URL, try hash parameters (for single-page app routing)
    if (!docId && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      docId = hashParams.get('replyTo') || hashParams.get('docId') || hashParams.get('id');
    }
    
    // If still not found, try sessionStorage as fallback
    if (!docId) {
      try {
        const replyData = sessionStorage.getItem('createReply');
        if (replyData) {
          const data = JSON.parse(replyData);
          docId = data.source_document_id;
          
          // Pre-fill form fields from sessionStorage
          if (data.from) setFromField(data.from);
          if (data.to) setToField(data.to);
          if (data.dateTimeReceived) setDateTimeReceived(data.dateTimeReceived);
          if (data.reply_title) setReplyTitle(data.reply_title);
          if (data.reply_description) setReplyDescription(data.reply_description);
        }
      } catch (e) {
        console.warn('Failed to parse reply data from sessionStorage:', e);
      }
    }
    
    if (docId) {
      setSourceDocumentId(docId);
    }
  }, []);

  // Validate Google Drive link
  const isValidDriveLink = (link) => {
    const drivePatterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+\//,
      /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\//
    ];
    return !!(link && drivePatterns.some(p => p.test(link)));
  };

  // Build an iframe preview URL for Google Drive links
  const getDrivePreviewUrl = (link) => {
    if (!link) return null;
    let m = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/preview`;
    m = link.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/presentation/d/${m[1]}/preview`;
    return null;
  };

  // Get direct view URL for Google Drive links
  const getDriveViewUrl = (link) => {
    if (!link) return null;
    let m = link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    return link; // Return original if no match
  };

  const previewUrl = useMemo(() => getDrivePreviewUrl(replyLink), [replyLink]);

  useEffect(() => {
    setShowPreviewPanel(isValidDriveLink(replyLink) && !!previewUrl);
  }, [replyLink, previewUrl]);

  // Prefill removed per request

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    if (!sourceDocumentId) {
      setError('Missing source document ID. Please navigate to this page from a document\'s reply button or add ?replyTo=<docId> to the URL.');
      return;
    }
    const errs = {};
    if (!replyTitle.trim()) errs.replyTitle = 'Title is required';
    if (!replyLink.trim()) errs.replyLink = 'Google Drive link is required';
    else if (!isValidDriveLink(replyLink)) errs.replyLink = 'Please enter a valid Google Drive link';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSubmitting(true);
    try {
      // Try to get a Reply document type id to satisfy backend if needed
      let replyTypeId = null;
      try {
        const typesRes = await fetch('http://localhost:5000/api/document-types', { method: 'GET', credentials: 'include' });
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          const list = Array.isArray(typesData) ? typesData : (typesData.documentTypes || []);
          const byName = list.find(t => (t.name || t.type_name || '').toString().toLowerCase() === 'reply');
          if (byName) replyTypeId = byName.type_id ?? byName.id ?? byName.typeId ?? null;
          if (!replyTypeId && list.length > 0) {
            const f = list[0];
            replyTypeId = f.type_id ?? f.id ?? f.typeId ?? null;
          }
        }
      } catch {}

      const res = await fetch('http://localhost:5000/api/documents/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          original_doc_id: sourceDocumentId,
          title: replyTitle,
          description: replyDescription,
          google_drive_link: replyLink,
          reply_type: 'action_response',
          from_field: fromField,
          to_field: toField,
          date_received: dateTimeReceived,
          ...(replyTypeId ? { doc_type: replyTypeId, type_id: replyTypeId, doc_type_id: replyTypeId } : {})
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Reply uploaded successfully');
        sessionStorage.removeItem('createReply');
        setTimeout(() => {
          if (onNavigateToDocuments) onNavigateToDocuments('requests');
        }, 1200);
      } else {
        setError(data.message || 'Failed to upload reply');
      }
    } catch (err) {
      setError('Failed to upload reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Upload Reply</h2>
          <div style={{
            backgroundColor: sourceDocumentId ? '#f0f9ff' : '#fef2f2',
            border: `1px solid ${sourceDocumentId ? '#0ea5e9' : '#f87171'}`,
            borderRadius: 6,
            padding: '8px 12px',
            marginTop: 8,
            fontSize: 13,
            color: sourceDocumentId ? '#0c4a6e' : '#991b1b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            {sourceDocumentId ? (
              <>
                <FiCheck size={14} /> Replying to document ID: {sourceDocumentId}
              </>
            ) : (
              <>
                <FiAlertCircle size={14} /> No source document ID found in URL
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0 }}>
        {!!error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>
            <FiAlertCircle /> {error}
          </div>
        )}
        {!!success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>
            <FiCheck /> {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>From</div>
            <input type="text" value={fromField} onChange={e => setFromField(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>To</div>
            <input type="text" value={toField} onChange={e => setToField(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>Date/Time</div>
            <input type="datetime-local" value={dateTimeReceived} onChange={e => setDateTimeReceived(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>Reply Title *</div>
          <input type="text" value={replyTitle} onChange={e => setReplyTitle(e.target.value)} placeholder="e.g., Response to Memo #123" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${fieldErrors.replyTitle ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6 }} />
          {fieldErrors.replyTitle && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{fieldErrors.replyTitle}</div>}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>Description</div>
          <textarea value={replyDescription} onChange={e => setReplyDescription(e.target.value)} rows={3} placeholder="Brief description of your response..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280' }}>Google Drive Link *</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="url" value={replyLink} onChange={e => setReplyLink(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{ flex: 1, padding: '10px 12px', border: `1px solid ${fieldErrors.replyLink ? '#fca5a5' : '#d1d5db'}`, borderRadius: 6 }} />
            <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => replyLink && window.open(replyLink, '_blank')} disabled={!replyLink} title="Open in new tab">Open</button>
          </div>
          {fieldErrors.replyLink && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{fieldErrors.replyLink}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-light border rounded-pill px-3" onClick={() => onNavigateToDocuments && onNavigateToDocuments('requests')} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary border rounded-pill px-3" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload Reply'}</button>
        </div>
      </form>
      {showPreviewPanel && (
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Document Link</div>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: 10, 
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#4285f4', 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Google Drive Document
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Click below to open in new tab
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => window.open(getDriveViewUrl(replyLink), '_blank')}
              style={{
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
              Open Document
            </button>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default Reply;




