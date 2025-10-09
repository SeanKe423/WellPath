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
      <h1>Admin Dashboard</h1>
      <h2>Pending Institution Approvals</h2>
      <div className="institutions-list">
        {institutions.length === 0 ? (
          <p>No pending institutions to review.</p>
        ) : (
          institutions.map(institution => (
            <div key={institution._id} className="institution-card">
              <h3>{institution.name}</h3>
              <p><strong>Email:</strong> {institution.email}</p>
              <p><strong>Type:</strong> {institution.type}</p>
              <p><strong>Status:</strong> {institution.approvalStatus}</p>
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