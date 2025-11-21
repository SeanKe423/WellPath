import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const fetchInstitutions = async () => {
    try {
      console.log('Fetching institutions with token:', token);
      const response = await axios.get('http://localhost:5000/api/admin/institutions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Institutions response:', response.data);
      setInstitutions(response.data.institutions || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setError('Failed to fetch institutions');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userRole === 'admin') {
      fetchInstitutions();
    }
  }, [token, userRole]);

  const handleApprove = async (institutionId) => {
    try {
      setProcessingId(institutionId);
      console.log('Approving institution:', institutionId);
      
      const response = await axios.put(`http://localhost:5000/api/admin/institutions/${institutionId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Approval response:', response.data);
      
      // Update the institutions list with the new status
      setInstitutions(prevInstitutions => 
        prevInstitutions.map(inst => 
          inst._id === institutionId ? { ...inst, approvalStatus: 'approved' } : inst
        )
      );
      
      // Refresh the list after a short delay
      setTimeout(fetchInstitutions, 1000);
    } catch (err) {
      console.error('Error approving institution:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to approve institution');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (institutionId) => {
    try {
      setProcessingId(institutionId);
      console.log('Rejecting institution:', institutionId);
      
      const response = await axios.put(`http://localhost:5000/api/admin/institutions/${institutionId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Rejection response:', response.data);
      
      // Update the institutions list with the new status
      setInstitutions(prevInstitutions => 
        prevInstitutions.map(inst => 
          inst._id === institutionId ? { ...inst, approvalStatus: 'rejected' } : inst
        )
      );
      
      // Refresh the list after a short delay
      setTimeout(fetchInstitutions, 1000);
    } catch (err) {
      console.error('Error rejecting institution:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to reject institution');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-dashboard-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <p>{error}</p>
        <button onClick={() => {
          setError('');
          fetchInstitutions();
        }} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'inline-block', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Admin Dashboard</h1>
        <button
          className="logout-button"
          onClick={handleLogout}
          style={{ padding: '8px 16px', fontSize: '0.9rem', width: '110px', position: 'absolute', right: '0.5rem', top: '0.8rem' }}
        >
          Log Out
        </button>
      </div>
      <h2>Pending Institution Approvals</h2>
      <div className="institutions-list">
        {institutions.length === 0 ? (
          <p>No pending institutions to review.</p>
        ) : (
          institutions.map(institution => (
            <div key={institution._id} className="institution-card">
              <div className="card-header">
                <h3>{institution.institutionName || 'N/A'}</h3>
                <span className={`status-badge ${institution.approvalStatus || 'pending'}`}>
                  {institution.approvalStatus || 'pending'}
                </span>
              </div>
              
              <div className="card-body">
                <div className="info-section">
                  <h4>Institution Details</h4>
                  <p><strong>Email:</strong> {institution.email || 'Not provided'}</p>
                  <p><strong>Registration Number:</strong> {institution.registrationNumber || 'Not provided'}</p>
                  <p><strong>Type:</strong> {institution.institutionType || 'Not provided'}</p>
                  <p><strong>Years of Operation:</strong> {
                    institution.yearsOfOperation === 'less1' ? 'Less than 1 year' :
                    institution.yearsOfOperation === '1-5' ? '1-5 years' :
                    institution.yearsOfOperation === '6-10' ? '6-10 years' :
                    institution.yearsOfOperation === '10+' ? '10+ years' :
                    institution.yearsOfOperation || 'Not provided'
                  }</p>
                </div>

                <div className="info-section">
                  <h4>Contact Information</h4>
                  <p><strong>Address:</strong> {institution.location?.address || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {institution.phoneNumber || 'Not provided'}</p>
                </div>

                <div className="info-section">
                  <h4>Services Offered</h4>
                  {institution.counselingServices && institution.counselingServices.length > 0 ? (
                    <div className="services-list">
                      {institution.counselingServices.map((service, index) => (
                        <span key={index} className="service-tag">{service}</span>
                      ))}
                      {institution.otherCounselingService && (
                        <span className="service-tag">{institution.otherCounselingService}</span>
                      )}
                    </div>
                  ) : (
                    <p>No services specified</p>
                  )}
                </div>

                <div className="info-section">
                  <p><strong>Submission Date:</strong> {
                    institution.createdAt 
                      ? new Date(institution.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not available'
                  }</p>
                </div>
              </div>

              {institution.approvalStatus === 'pending' && (
                <div className="approval-buttons">
                  <button 
                    onClick={() => handleApprove(institution._id)}
                    className="approve-button"
                    disabled={processingId === institution._id}
                  >
                    {processingId === institution._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => handleReject(institution._id)}
                    className="reject-button"
                    disabled={processingId === institution._id}
                  >
                    {processingId === institution._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 