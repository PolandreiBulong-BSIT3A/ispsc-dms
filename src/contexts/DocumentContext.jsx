import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '../lib/api/frontend/http.js';
import { buildUrl } from '../lib/api/frontend/client.js';

const DocumentContext = createContext();

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  // Core state
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    documentType: '',
    status: '',
    dateRange: { start: null, end: null }
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // API base URL
  const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || buildUrl('');

  // Utility function for API calls
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        if (response.status === 403) {
          throw new Error('Access denied - Insufficient permissions');
        }
        if (response.status === 404) {
          throw new Error('Resource not found');
        }
        if (response.status >= 500) {
          throw new Error('Server error - Please try again later');
        }
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, []);

  // Fetch all documents from API
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filters.department && { department: filters.department }),
        ...(filters.documentType && { type: filters.documentType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateRange.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange.end && { endDate: filters.dateRange.end })
      });

      const data = await apiCall(`/documents?${queryParams}`);
      
      if (data.success) {
        setDocuments(data.documents);
        setFilteredDocuments(data.documents);
      } else {
        throw new Error(data.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, apiCall]);

  // Search documents
  const searchDocuments = useCallback((term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(doc => 
      doc.title?.toLowerCase().includes(term.toLowerCase()) ||
      doc.description?.toLowerCase().includes(term.toLowerCase()) ||
      doc.documentNumber?.toLowerCase().includes(term.toLowerCase()) ||
      doc.department?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [documents]);

  // Apply filters
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      department: '',
      documentType: '',
      status: '',
      dateRange: { start: null, end: null }
    });
    setSearchTerm('');
    setFilteredDocuments(documents);
  }, [documents]);

  // Force refresh documents
  const refreshDocuments = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  // Add new document
  const addDocument = useCallback(async (documentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('/documents', {
        method: 'POST',
        body: JSON.stringify(documentData)
      });

      if (data.success) {
        // Merge action-required names from client payload if backend doesn't return them
        const clientActionNames = Array.isArray(documentData.actionRequiredNames) ? documentData.actionRequiredNames : [];
        const newDocument = {
          ...data.document,
          ...(clientActionNames.length > 0 && !data.document.action_required_name && !Array.isArray(data.document.action_required) ? { action_required: clientActionNames } : {})
        };
        
        // Immediately update the documents list
        setDocuments(prev => [newDocument, ...prev]);
        setFilteredDocuments(prev => [newDocument, ...prev]);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalItems: prev.totalItems + 1
        }));

        // Show success message
        console.log('Document added successfully:', newDocument);
        

        
        return { success: true, message: data.message || 'Document uploaded successfully!', document: newDocument };
      } else {
        throw new Error(data.message || 'Failed to add document');
      }
    } catch (err) {
      console.error('Error adding document:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Remove document (move to trashcan)
  const removeDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the trashcan API to move document to trashcan
      const data = await apiCall('/documents/trashcan', {
        method: 'POST',
        body: JSON.stringify({
          documentId: documentId,
          action: 'move_to_trashcan'
        })
      });

      if (data.success) {
        // Remove the document from the current lists
        setDocuments(prev => prev.filter(doc => doc.doc_id !== documentId && doc.id !== documentId));
        setFilteredDocuments(prev => prev.filter(doc => doc.doc_id !== documentId && doc.id !== documentId));
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1)
        }));

        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to move document to trashcan');
      }
    } catch (err) {
      console.error('Error moving document to trashcan:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Permanently delete document from trashcan
  const permanentlyDeleteDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall(`/documents/trashcan/${documentId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to permanently delete document');
      }
    } catch (err) {
      console.error('Error permanently deleting document:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Update document
  const updateDocument = useCallback(async (documentId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall(`/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (data.success) {
        // Use the document returned from the API, or create updated version
        const updatedDocument = data.document || { id: documentId, ...updates };

        // Ensure updated timestamp is present for immediate UI feedback
        const nowIso = new Date().toISOString();
        const stamped = {
          ...updatedDocument,
          updated_at: updatedDocument.updated_at || updatedDocument.updatedAt || nowIso,
          updatedAt: updatedDocument.updatedAt || updatedDocument.updated_at || nowIso,
        };
        
        // Update both documents and filteredDocuments arrays
        setDocuments(prev => prev.map(doc => 
          (doc.id === documentId || doc.doc_id === documentId) ? stamped : doc
        ));
        setFilteredDocuments(prev => prev.map(doc => 
          (doc.id === documentId || doc.doc_id === documentId) ? stamped : doc
        ));

        return { success: true, message: data.message, document: stamped };
      } else {
        throw new Error(data.message || 'Failed to update document');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Get document by ID
  const getDocumentById = useCallback((documentId) => {
    return documents.find(doc => doc.id === documentId);
  }, [documents]);



  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);



  // Fetch deleted documents from trashcan
  const fetchDeletedDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall(`/documents/trashcan?ts=${Date.now()}`);
      
      if (data.success) {
        // Support both response shapes
        const results = data.deletedDocuments || data.documents || [];
        return Array.isArray(results) ? results : [];
      } else {
        throw new Error(data.message || 'Failed to fetch deleted documents');
      }
    } catch (err) {
      console.error('Error fetching deleted documents:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Restore document from trashcan
  const restoreDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('/documents/trashcan', {
        method: 'POST',
        body: JSON.stringify({
          documentId: documentId,
          action: 'restore_from_trashcan'
        })
      });

      if (data.success) {
        // Refresh the documents list to show the restored document
        await fetchDocuments();
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to restore document');
      }
    } catch (err) {
      console.error('Error restoring document:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiCall, fetchDocuments]);

  // Restore a specific version of a document
  const restoreVersion = useCallback(async (_documentId, _versionId) => {
    // Versioning endpoints have been removed from the backend
    const message = 'Document versioning is no longer supported.';
    console.warn(message);
    return { success: false, message };
  }, []);

  // Fetch current visibility info for a document
  const fetchDocumentVisibility = useCallback(async (documentId) => {
    try {
      const data = await apiCall(`/documents/${documentId}/visibility`);
      // Normalize shape
      const v = data.visibility || data || {};
      const visible_to_all = v.visible_to_all === 1 || v.visible_to_all === true || v.mode === 'ALL';
      let department_ids = [];
      if (Array.isArray(v.department_ids)) {
        department_ids = v.department_ids.map(n => Number(n)).filter(Boolean);
      } else if (typeof v.department_ids === 'string') {
        department_ids = v.department_ids.split(',').map(s => Number(s.trim())).filter(Boolean);
      } else if (Array.isArray(v.departments)) {
        department_ids = v.departments.map(d => Number(d.department_id || d.id || d.value)).filter(Boolean);
      }
      let user_ids = [];
      if (Array.isArray(v.user_ids)) {
        user_ids = v.user_ids.map(n => Number(n)).filter(Boolean);
      } else if (Array.isArray(v.users)) {
        user_ids = v.users.map(u => Number(u.user_id || u.id)).filter(Boolean);
      }
      let roles = [];
      if (Array.isArray(v.roles)) {
        roles = v.roles.map(r => (r || '').toString().toUpperCase()).filter(Boolean);
      }
      return { visible_to_all, department_ids, user_ids, roles };
    } catch (err) {
      console.warn('fetchDocumentVisibility failed; falling back to local doc fields.', err);
      return null;
    }
  }, [apiCall]);

  // Fetch documents that require action for current user/department/role
  const fetchRequestDocuments = useCallback(async () => {
    try {
      const data = await apiCall('/documents/requests');
      if (data.success) {
        return data.documents || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching request documents:', err);
      return [];
    }
  }, [apiCall]);

  // Load documents on mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Apply search and filters to documents
  useEffect(() => {
    let filtered = documents;

    // Apply search
    if (searchTerm.trim()) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.department) {
      filtered = filtered.filter(doc => doc.department === filters.department);
    }
    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.createdAt || doc.updatedAt);
        if (filters.dateRange.start && docDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && docDate > new Date(filters.dateRange.end)) {
          return false;
        }
        return true;
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, filters]);

  const value = {
    // State
    documents,
    filteredDocuments,
    loading,
    error,
    searchTerm,
    filters,
    pagination,
    
    // Actions
    addDocument,
    removeDocument,
    updateDocument,
    fetchDocuments,
    searchDocuments,
    applyFilters,
    clearFilters,
    getDocumentById,
    clearError,
    refreshDocuments,
    fetchDeletedDocuments,
    restoreDocument,
    permanentlyDeleteDocument,
    fetchDocumentVisibility,
    fetchRequestDocuments,
    
    // Computed values
    hasDocuments: documents.length > 0,
    hasFilteredDocuments: filteredDocuments.length > 0
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}; 