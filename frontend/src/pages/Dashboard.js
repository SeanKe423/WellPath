import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log("Using token:", token); // Debug log

        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/auth/user-profile', {
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("Profile response:", response.data); // Debug log
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error.response?.data?.message || 'Failed to load institution profile');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/institution-profile');
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!profile) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome to Your Dashboard</h2>
        <div className="dashboard-actions">
          <button onClick={handleEditProfile} className="edit-button">
            Edit Profile
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="profile-info">
          <h3>Institution Profile</h3>
          <div className="info-section">
            <h4>Basic Information</h4>
            <p><strong>Institution Name:</strong> {profile.institutionName || 'Not specified'}</p>
            <p><strong>Registration Number:</strong> {profile.registrationNumber || 'Not specified'}</p>
            <p><strong>Institution Type:</strong> {profile.institutionType || 'Not specified'}</p>
            <p><strong>Location:</strong> {profile.location?.address || 'Not specified'}</p>
            <p><strong>Phone:</strong> {profile.phoneNumber || 'Not specified'}</p>
            <p><strong>Email:</strong> {profile.email || 'Not specified'}</p>
            <p><strong>Website:</strong> {profile.website || 'Not specified'}</p>
          </div>
          <div className="info-section">
            <h4>Services & Details</h4>
            <p><strong>Counseling Services:</strong> {profile.counselingServices?.join(', ') || 'Not specified'}</p>
            <p><strong>Target Age Groups:</strong> {profile.targetAgeGroups?.join(', ') || 'Not specified'}</p>
            <p><strong>Languages:</strong> {profile.languages?.join(', ') || 'Not specified'}</p>
            <p><strong>Virtual Counseling:</strong> {profile.virtualCounseling ? 'Yes' : 'No'}</p>
            <p><strong>Number of Counselors:</strong> {profile.numberOfCounselors || 'Not specified'}</p>
            <p><strong>Wait Time:</strong> {profile.waitTime || 'Not specified'}</p>
            <p><strong>Legally Registered:</strong> {profile.isLegallyRegistered ? 'Yes' : 'No'}</p>
            <p><strong>Uphold Ethics:</strong> {profile.upholdEthics ? 'Yes' : 'No'}</p>
            <p><strong>Consent to Display:</strong> {profile.consentToDisplay ? 'Yes' : 'No'}</p>
          </div>
          {profile.documents && (
            <div className="info-section">
              <h4>Documents</h4>
              <a href={`http://localhost:5000${profile.documents}`} target="_blank" rel="noopener noreferrer">
                View Uploaded Documents
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 