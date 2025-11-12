import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/matching/matches', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      setMatches(response.data.matches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Error fetching matches. Please try again.');
      setLoading(false);
    }
  };

  // Age group labels to make it more readable/user-friendly
  const getAgeGroupLabel = (ageGroup) => {
    const labels = {
      'children': 'Children (0-12)',
      'adolescents': 'Adolescents (13-17)',
      'youngAdults': 'Young Adults (18-25)',
      'adults': 'Adults (26-64)',
      'seniors': 'Seniors (65+)'
    };
    return labels[ageGroup] || ageGroup;
  };

  const getInstitutionTypeLabel = (type) => {
    const labels = {
      'ngo': 'NGO / Non-profit',
      'private': 'Private Counseling Practice',
      'religious': 'Religious/Church-based Center',
      'university': 'University Counseling Center',
      'government': 'Government Clinic',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="connection-requests-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connection-requests-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="connection-requests-container">
      <div className="connection-requests-header">
        <h2>Your Matched Institutions</h2>
        <p className="subtitle">Connect with institutions that match your needs</p>
      </div>

      {matches.length === 0 ? (
        <div className="no-requests-message">
          <p>No matches found. Please update your profile preferences to find better matches.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/profile')}
          >
            Update Profile
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {matches.map(match => (
            <div key={match.institution.id} className="request-card">
              <div className="request-header">
                <h3>{match.institution.name}</h3>
              </div>

              <div className="request-content">
                <div className="request-section">
                  <h4>Compatibility</h4>
                  <p>Overall Match: {Math.round(match.scores.total)}%</p>
                </div>

                <div className="request-section">
                  <h4>Services Offered</h4>
                  <div className="tags-container">
                    {match.institution.counselingServices?.map((service, index) => (
                      <span key={`${match.institution.id}-service-${index}`} className="service-tag">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="request-section">
                  <h4>Languages Offered</h4>
                  <div className="tags-container">
                    {match.institution.languages?.map((lang, index) => (
                      <span key={`${match.institution.id}-lang-${index}`} className="language-tag">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="request-section">
                  <h4>Address</h4>
                  <p>{match.institution.location?.address || 'Address not provided'}</p>
                </div>

                <div className="request-section">
                  <h4>Type of Institution</h4>
                  <p>{getInstitutionTypeLabel(match.institution.institutionType)}</p>
                </div>


                <div className="request-section">
                  <h4>Age Groups</h4>
                  <div className="tags-container">
                    {match.institution.targetAgeGroups && match.institution.targetAgeGroups.length > 0 ? (
                      match.institution.targetAgeGroups.map((ageGroup, index) => (
                        <span key={`${match.institution.id}-age-${index}`} className="age-tag">
                          {getAgeGroupLabel(ageGroup)}
                        </span>
                      ))
                    ) : (
                      <span className="no-data">No age groups specified</span>
                    )}
                  </div>
                </div>

                <div className="request-section">
                  <h4>Email</h4>
                  <p style={{ fontSize: '0.95rem', color: '#555', margin: 0 }}>{match.institution.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        <button
          className="edit-button"
          onClick={() => navigate('/user-profile')}
        >
          Edit Profile
        </button>
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Matches; 