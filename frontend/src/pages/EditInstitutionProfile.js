import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const EditInstitutionProfile = () => {
  const [formData, setFormData] = useState({
    institutionName: '',
    registrationNumber: '',
    yearsOfOperation: '',
    institutionType: '',
    location: { address: '', coordinates: [0, 0] },
    phoneNumber: '',
    email: '',
    website: '',
    counselingServices: [],
    otherCounselingService: '',
    targetAgeGroups: [],
    languages: [],
    otherLanguage: '',
    virtualCounseling: false,
    numberOfCounselors: '',
    waitTime: '',
    numberOfInstitutions: '',
    isLegallyRegistered: false,
    consentToDisplay: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/institution-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFormData({ ...formData, ...response.data });
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Error loading profile data');
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        navigate('/login');
        return;
      }
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && !Array.isArray(formData[key]) && formData[key] !== null) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key].toString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      const response = await axios.put(
        'http://localhost:5000/api/auth/edit-institution-profile',
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      if (response.data) {
        alert('Profile updated successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert(error.response?.data?.message || 'Profile update failed');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h2>Edit Institution Profile</h2>
        <form onSubmit={handleSubmit}>
          <label>Institution Name
            <input type="text" name="institutionName" value={formData.institutionName} onChange={handleChange} />
          </label>
          <label>Registration Number
            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
          </label>
          <label>Years of Operation
            <input type="text" name="yearsOfOperation" value={formData.yearsOfOperation} onChange={handleChange} />
          </label>
          <label>Institution Type
            <input type="text" name="institutionType" value={formData.institutionType} onChange={handleChange} />
          </label>
          <label>Location (Address)
            <input type="text" name="location.address" value={formData.location?.address || ''} onChange={e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })} />
          </label>
          <label>Phone Number
            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
          </label>
          <label>Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </label>
          <label>Website
            <input type="text" name="website" value={formData.website} onChange={handleChange} />
          </label>
          <label>Counseling Services
            <input type="text" name="counselingServices" value={formData.counselingServices} onChange={handleChange} placeholder="Comma separated" />
          </label>
          <label>Other Counseling Service
            <input type="text" name="otherCounselingService" value={formData.otherCounselingService} onChange={handleChange} />
          </label>
          <label>Target Age Groups
            <input type="text" name="targetAgeGroups" value={formData.targetAgeGroups} onChange={handleChange} placeholder="Comma separated" />
          </label>
          <label>Languages
            <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="Comma separated" />
          </label>
          <label>Other Language
            <input type="text" name="otherLanguage" value={formData.otherLanguage} onChange={handleChange} />
          </label>
          <label>Virtual Counseling
            <input type="checkbox" name="virtualCounseling" checked={formData.virtualCounseling} onChange={handleChange} />
          </label>
          <label>Number of Counselors
            <input type="text" name="numberOfCounselors" value={formData.numberOfCounselors} onChange={handleChange} />
          </label>
          <label>Wait Time
            <input type="text" name="waitTime" value={formData.waitTime} onChange={handleChange} />
          </label>
          <label>Number of Institutions
            <input type="text" name="numberOfInstitutions" value={formData.numberOfInstitutions} onChange={handleChange} />
          </label>
          <label>Legally Registered
            <input type="checkbox" name="isLegallyRegistered" checked={formData.isLegallyRegistered} onChange={handleChange} />
          </label>
          <label>Consent to Display
            <input type="checkbox" name="consentToDisplay" checked={formData.consentToDisplay} onChange={handleChange} />
          </label>
          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditInstitutionProfile; 