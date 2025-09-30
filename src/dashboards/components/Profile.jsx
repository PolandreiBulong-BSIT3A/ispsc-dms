import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiSave, 
  FiEdit3, 
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
  FiUserCheck,
  FiCalendar,
  FiTrash2
} from 'react-icons/fi';
import { useUser } from '../../contexts/UserContext';

// Profile icon URLs (Google Drive links)
const PROFILE_ICONS = {
  icon1: 'https://drive.google.com/thumbnail?id=1b16bRna3IQSj58w6YSMEpFbODYdSOdBp&sz=w200',
  icon2: 'https://drive.google.com/thumbnail?id=1U5FMKfPi9NKTf6zlwKhx-kSTiArRYUt9&sz=w200',
  icon3: 'https://drive.google.com/thumbnail?id=1c9AN1HDmB7Jdp5swF5Kg0ccnDCnYaA9U&sz=w200',
  icon4: 'https://drive.google.com/thumbnail?id=1JBdk8rVdbM5D9ICXxoKDbLha0n0vicOU&sz=w200',
  icon5: 'https://drive.google.com/thumbnail?id=1aw5IxlFseHtPFf0GVJennFCRWtcYUiAe&sz=w200'
};


const Profile = () => {
  const { user: contextUser, loading: contextLoading, updateUser, refreshUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '', show: false });
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    department: '',
    contactNumber: '',
    profilePic: '',
    role: '',
    status: '',
    isVerified: false,
    createdAt: '',
    updatedAt: ''
  });

  // Profile icon options
  const profileIcons = [
    { id: 'icon1', src: PROFILE_ICONS.icon1, alt: 'Profile Icon 1' },
    { id: 'icon2', src: PROFILE_ICONS.icon2, alt: 'Profile Icon 2' },
    { id: 'icon3', src: PROFILE_ICONS.icon3, alt: 'Profile Icon 3' },
    { id: 'icon4', src: PROFILE_ICONS.icon4, alt: 'Profile Icon 4' },
    { id: 'icon5', src: PROFILE_ICONS.icon5, alt: 'Profile Icon 5' }
  ];

  // Department options - will be fetched from API
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Role options - matching database schema
  const roleOptions = [
            { value: 'FACULTY', label: 'Faculty' },
            { value: 'DEAN', label: 'Dean' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  // Status options - matching database schema
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'banned', label: 'Banned' },
    { value: 'deleted', label: 'Deleted' }
  ];


  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      console.log('Fetching departments...');
      const response = await fetch('http://localhost:5000/api/departments');
      console.log('Departments response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments API response:', data);
        
        if (data.success && data.departments) {
          console.log('Setting department options:', data.departments);
          setDepartmentOptions(data.departments);
        } else {
          console.error('Departments API returned no data or success false');
        }
      } else {
        console.error('Departments API error status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Update form data when context user changes
  useEffect(() => {
    if (contextUser) {
      console.log('Context user data:', contextUser);
      const departmentValue = contextUser.department_id?.toString() || contextUser.department || '';
      console.log('Department value from context:', departmentValue);
      
      setFormData({
        username: contextUser.username || '',
        email: contextUser.email || '',
        firstname: contextUser.firstname || '',
        lastname: contextUser.lastname || '',
        department: departmentValue,
        contactNumber: contextUser.contactNumber || '',
        profilePic: contextUser.profilePic || '',
        role: contextUser.role || '',
        status: contextUser.status || '',
        isVerified: contextUser.isVerified || false,
        createdAt: contextUser.createdAt || '',
        updatedAt: contextUser.updatedAt || ''
      });
      console.log('Set form data from context:', {
        username: contextUser.username || '',
        email: contextUser.email || '',
        firstname: contextUser.firstname || '',
        lastname: contextUser.lastname || '',
        department: departmentValue,
        contactNumber: contextUser.contactNumber || '',
        profilePic: contextUser.profilePic || '',
        role: contextUser.role || '',
        status: contextUser.status || '',
        isVerified: contextUser.isVerified || false,
        createdAt: contextUser.createdAt || '',
        updatedAt: contextUser.updatedAt || ''
      });
    }
  }, [contextUser]);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Debug effect to log department options changes
  useEffect(() => {
    console.log('Department options updated:', departmentOptions);
  }, [departmentOptions]);


  // Debug effect to log formData changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const handleInputChange = (field, value) => {
    // Special validation for contact number
    if (field === 'contactNumber') {
      // Only allow numbers and limit to 11 digits
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digit characters
      if (numericValue.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [field]: numericValue
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileIconSelect = async (iconSrc) => {
    try {
      setLoading(true);
      
      // For now, just update the local state since the API expects file upload
      // TODO: Implement proper file upload for profile pictures
      setFormData(prev => ({
        ...prev,
        profilePic: iconSrc
      }));
      
      // Update context user
      const updated = { ...contextUser, profilePic: iconSrc };
      updateUser(updated);
      
      setMessage({ 
        text: 'Profile picture updated locally! (Server update requires file upload implementation)', 
        type: 'warning', 
        show: true 
      });
      
      setTimeout(() => setMessage({ text: '', type: '', show: false }), 3000);
      setShowProfileSelector(false);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setMessage({ 
        text: 'Failed to update profile picture', 
        type: 'danger', 
        show: true 
      });
      setTimeout(() => setMessage({ text: '', type: '', show: false }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (formData.profilePic) {
      // Check if it's one of our local icons
      const icon = profileIcons.find(icon => icon.src === formData.profilePic);
      if (icon) {
        return icon.src;
      }
      // If it's a URL (Google profile pic), return as is
      return formData.profilePic;
    }
    return null;
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    // You could set a fallback image here if needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '', show: false });

    // Validate contact number
    if (formData.contactNumber && formData.contactNumber.length !== 11) {
      setMessage({ 
        text: 'Contact number must be exactly 11 digits', 
        type: 'danger', 
        show: true 
      });
      setLoading(false);
      return;
    }

    // Debug logging
    console.log('User object:', contextUser);
    console.log('Form data:', formData);

    try {
      
      const requestBody = {
        email: contextUser.email,
        username: formData.username,
        firstname: formData.firstname,
        lastname: formData.lastname,
        department: formData.department, // This will be department_id as string
        contactNumber: formData.contactNumber
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response text:', textResponse);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok && data.success) {
        // Update context user data
        const updated = { 
          ...contextUser, 
          username: formData.username,
          firstname: formData.firstname,
          lastname: formData.lastname,
          department_id: formData.department, // Convert to department_id
          contactNumber: formData.contactNumber
        };
        
        // Update the context user
        updateUser(updated);
        
        // Refresh user data from server to ensure banner logic gets latest data
        await refreshUser();
        
        setMessage({ 
          text: data.message || 'Profile updated successfully!', 
          type: 'success', 
          show: true 
        });
        setIsEditing(false);
      } else {
        setMessage({ 
          text: data.message || 'Failed to update profile', 
          type: 'danger', 
          show: true 
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: 'Network error. Please try again.', 
        type: 'danger', 
        show: true 
      });
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    if (contextUser) {
      setFormData({
        username: contextUser.username || '',
        email: contextUser.email || '',
        firstname: contextUser.firstname || '',
        lastname: contextUser.lastname || '',
        department: contextUser.department_id?.toString() || contextUser.department || '',
        contactNumber: contextUser.contactNumber || '',
        role: contextUser.role || '',
        status: contextUser.status || '',
        isVerified: contextUser.isVerified || false,
        createdAt: contextUser.createdAt || '',
        updatedAt: contextUser.updatedAt || ''
      });
    }
    setIsEditing(false);
    setShowProfileSelector(false);
    setMessage({ text: '', type: '', show: false });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'delete') {
      setMessage({ 
        text: 'Please type "delete" exactly to confirm account deletion', 
        type: 'danger', 
        show: true 
      });
      return;
    }

    try {
      setDeletingAccount(true);
      
      const response = await fetch('http://localhost:5000/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          text: 'Account deleted successfully. You will be logged out.', 
          type: 'success', 
          show: true 
        });
        
        // Close modal and reset
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        
        // Logout after a short delay
        setTimeout(() => {
          // Redirect to login page or trigger logout
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage({ 
          text: data.message || 'Failed to delete account', 
          type: 'danger', 
          show: true 
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ 
        text: 'Network error. Please try again.', 
        type: 'danger', 
        show: true 
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrator';
              case 'DEAN':
                  return 'Dean';
              case 'FACULTY':
                  return 'Faculty';
      default:
        return role || 'Unknown';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending Verification';
      case 'banned':
        return 'Banned';
      case 'deleted':
        return 'Deleted';
      default:
        return status || 'Unknown';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'warning';
      case 'banned':
        return 'danger';
      case 'deleted':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  // Get department display name
  const getDepartmentDisplayName = (departmentId) => {
    console.log('Getting department display name for:', departmentId);
    console.log('Available department options:', departmentOptions);
    
    if (!departmentId) return 'Not assigned';
    
    // Try to find by exact value match
    let dept = departmentOptions.find(opt => opt.value === departmentId);
    
    // If not found, try to find by string comparison (case-insensitive)
    if (!dept) {
      dept = departmentOptions.find(opt => 
        opt.value.toString().toLowerCase() === departmentId.toString().toLowerCase()
      );
    }
    
    // If still not found, try to find by label (for backward compatibility)
    if (!dept) {
      dept = departmentOptions.find(opt => 
        opt.label.toLowerCase().includes(departmentId.toString().toLowerCase())
      );
    }
    
    console.log('Found department:', dept);
    
    if (dept) {
      return dept.label;
    } else {
      // For debugging: show both the ID and available options
      console.warn(`Department ID ${departmentId} not found in options:`, departmentOptions);
      return `Department ID: ${departmentId} (Name not found)`;
    }
  };

  // Get current department name for display
  const getCurrentDepartmentName = () => {
    console.log('Getting current department name...');
    console.log('Department options count:', departmentOptions.length);
    console.log('Form data department:', formData.department);
    console.log('Context user department_name:', contextUser?.department_name);
    
    // If departments haven't loaded yet, try to show from context
    if (departmentOptions.length === 0 && contextUser?.department_name) {
      console.log('Using department_name from context:', contextUser.department_name);
      return contextUser.department_name;
    }
    
    // If we have department options, use the lookup function
    if (departmentOptions.length > 0) {
      const result = getDepartmentDisplayName(formData.department);
      console.log('Lookup result:', result);
      return result;
    }
    
    // Fallback: show the raw value
    console.log('Using fallback value:', formData.department || 'Loading departments...');
    return formData.department || 'Loading departments...';
  };

  if (contextLoading || !contextUser) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="spinner-border text-muted" style={{ width: '2rem', height: '2rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem 0'
    }}>
      <Container style={{ maxWidth: '1000px' }}>
        {/* Alert Messages */}
        {message.show && (
          <div className="mb-4">
            <Alert 
              variant={message.type} 
              dismissible 
              onClose={() => setMessage({ text: '', type: '', show: false })}
              style={{ 
                borderRadius: 12, 
                border: 'none',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div className="d-flex align-items-center">
                {message.type === 'success' ? (
                  <FiCheckCircle className="me-2" size={16} />
                ) : (
                  <FiAlertCircle className="me-2" size={16} />
                )}
                {message.text}
              </div>
            </Alert>
          </div>
        )}

        {/* Top Banner */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '25px',
          marginBottom: '2rem',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              {/* Profile Picture */}
              <div className="me-4 position-relative">
                {getProfileImage() ? (
                  <img
                    src={getProfileImage()}
                    alt="Profile"
                    className="rounded-circle"
                    onError={handleImageError}
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      objectFit: 'cover',
                      border: '3px solid #ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <FiUser size={32} color="#6c757d" />
                  </div>
                )}
                
                {isEditing && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowProfileSelector(true)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      borderRadius: '50px',
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: '2px'
                    }}
                  >
                    <FiCamera size={14} />
                  </Button>
                )}
              </div>

              {/* User Info */}
              <div>
                <h3 style={{ 
                  margin: 0, 
                  color: '#212529',
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}>
                  {formData.firstname && formData.lastname 
                    ? `${formData.firstname} ${formData.lastname}`
                    : formData.username || 'User Profile'
                  }
                </h3>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  color: '#6c757d',
                  fontSize: '1rem'
                }}>
                  {formData.email}
                </p>
                <div className="d-flex align-items-center mt-2">
                  <span className={`badge bg-${getStatusBadgeVariant(formData.status)} me-2`}>
                    {getStatusDisplayName(formData.status)} ({formData.status || 'undefined'})
                  </span>
                  <span className="badge bg-info">
                    {getRoleDisplayName(formData.role)} ({formData.role || 'undefined'})
                  </span>
                  <span className="badge bg-secondary ms-2">
                    {formData.isVerified ? 'Verified' : 'Not Verified'} ({formData.isVerified ? 'true' : 'false'})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-column gap-2">
              {!isEditing ? (
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => setIsEditing(true)}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px'
                    }}
                  >
                    <FiEdit3 className="me-2" size={16} />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px'
                    }}
                  >
                    <FiTrash2 className="me-2" size={16} />
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div className="d-flex gap-3">
                  <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500,
                      borderWidth: '2px'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={loading}
                    onClick={handleSubmit}
                    style={{ 
                      borderRadius: '50px',
                      fontSize: '0.9rem',
                      padding: '0.75rem 2rem',
                      fontWeight: 500
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="me-2" size={16} />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Form>
            <Row className="g-4">
              {/* First Name */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    First Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your first name"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (isEditing) {
                        e.target.style.borderColor = '#007bff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isEditing) {
                        e.target.style.borderColor = '#dee2e6';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Last Name */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Last Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your last name"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Username */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Username
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your username"
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Department */}
              <Col md={6}>
                <Form.Group>
                  
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Department
                    {departmentsLoading && (
                      <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                        (Loading...)
                      </span>
                    )}
                  </Form.Label>
                  {isEditing ? (
                    <Form.Select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={departmentsLoading}
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <option value="">
                        {departmentsLoading ? 'Loading departments...' : 'Select department'}
                      </option>
                      {departmentOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={getCurrentDepartmentName()}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                  {!formData.department && (
                    <Form.Text style={{ fontSize: '0.8rem', color: '#dc3545' }}>
                      Please select your department
                    </Form.Text>
                  )}
                  
                </Form.Group>
              </Col>

              {/* Contact Number */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Contact Number
                    {isEditing && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: formData.contactNumber.length === 11 ? '#28a745' : '#6c757d',
                        marginLeft: '0.5rem',
                        fontWeight: 'normal'
                      }}>
                        ({formData.contactNumber.length}/11)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="09XX XXX XXXX"
                    maxLength={11}
                    style={{ 
                      borderRadius: '50px', 
                      border: `2px solid ${formData.contactNumber.length === 11 ? '#28a745' : '#dee2e6'}`,
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: isEditing ? '#ffffff' : '#f8f9fa',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Form.Text style={{ 
                    fontSize: '0.8rem', 
                    color: formData.contactNumber.length === 11 ? '#28a745' : '#6c757d'
                  }}>
                    Philippine mobile number format (11 digits required)
                    {formData.contactNumber.length > 0 && formData.contactNumber.length < 11 && (
                      <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>
                        - {11 - formData.contactNumber.length} more digits needed
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>
              </Col>



              {/* Email (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Form.Text style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    Email cannot be changed
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Role (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Role
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={`${getRoleDisplayName(formData.role)} (${formData.role || 'undefined'})`}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Status (Read-only) */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Account Status
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={`${getStatusDisplayName(formData.status)} (${formData.status || 'undefined'})`}
                    disabled
                    style={{ 
                      borderRadius: '50px', 
                      border: '2px solid #dee2e6',
                      padding: '1rem 1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Verification Status */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Verification Status
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="text"
                      value={`${formData.isVerified ? 'Verified' : 'Not Verified'} (${formData.isVerified ? 'true' : 'false'})`}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    {formData.isVerified && (
                      <FiUserCheck 
                        className="ms-2" 
                        size={20} 
                        color="#28a745" 
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </div>
                </Form.Group>
              </Col>

              {/* Created Date */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '0.75rem'
                  }}>
                    Member Since
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="text"
                      value={`${formatDate(formData.createdAt)} (${formData.createdAt || 'undefined'})`}
                      disabled
                      style={{ 
                        borderRadius: '50px', 
                        border: '2px solid #dee2e6',
                        padding: '1rem 1.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <FiCalendar 
                      className="ms-2" 
                      size={20} 
                      color="#6c757d" 
                      style={{ flexShrink: 0 }}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '25px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div className="text-center mb-4">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  border: '3px solid #fecaca'
                }}>
                  <FiTrash2 size={32} color="#dc3545" />
                </div>
                <h4 style={{ color: '#dc3545', fontWeight: 600 }}>Delete Account</h4>
                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>

              <div className="mb-4">
                <Form.Label style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  color: '#495057',
                  marginBottom: '0.75rem'
                }}>
                  Type "delete" to confirm
                </Form.Label>
                <Form.Control
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  style={{ 
                    borderRadius: '50px', 
                    border: '2px solid #dee2e6',
                    padding: '1rem 1.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && deleteConfirmation === 'delete') {
                      handleDeleteAccount();
                    }
                  }}
                />
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={deletingAccount}
                  style={{
                    borderRadius: '50px',
                    padding: '0.75rem 2rem',
                    borderWidth: '2px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'delete' || deletingAccount}
                  style={{
                    borderRadius: '50px',
                    padding: '0.75rem 2rem',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  {deletingAccount ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="me-2" size={16} />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Picture Selector Modal */}
        {showProfileSelector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2.5rem',
              borderRadius: '25px',
              maxWidth: '600px',
              width: '95%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <h5 className="mb-3">Select Profile Picture</h5>
              <div className="d-flex gap-4 justify-content-center flex-wrap">
                {profileIcons.map(icon => (
                  <div
                    key={icon.id}
                    onClick={() => handleProfileIconSelect(icon.src)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.75rem',
                      borderRadius: '25px',
                      border: formData.profilePic === icon.src ? '3px solid #007bff' : '2px solid #e9ecef',
                      transition: 'all 0.3s ease',
                      backgroundColor: formData.profilePic === icon.src ? '#f8f9ff' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '100px'
                    }}
                  >
                    <img
                      src={icon.src}
                      alt={icon.alt}
                      onError={handleImageError}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      textAlign: 'center'
                    }}>
                      {icon.alt}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowProfileSelector(false)}
                  size="sm"
                  style={{
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    borderWidth: '2px'
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Profile; 