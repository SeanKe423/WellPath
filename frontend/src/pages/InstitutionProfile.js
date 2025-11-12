import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import signupImage from '../signupuser.jpg';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { COUNSELING_SERVICES } from '../constants/counselingServices';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InstitutionProfile = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Institution Details
    institutionName: '',
    registrationNumber: '',
    yearsOfOperation: '',
    institutionType: '',
    otherInstitutionType: '',

    // Step 2: Location & Contact
    location: {
      coordinates: [0, 0],
      address: ''
    },
    phoneNumber: '',
    email: '',
    website: '',

    // Step 3: Services Offered
    counselingServices: [],
    otherCounselingService: '',
    targetAgeGroups: [],
    languages: [],
    otherLanguage: '',
    virtualCounseling: '',

    // Step 4: Staff & Capacity
    numberOfCounselors: '',
    waitTime: '',

    // Step 5: Ethics, Verification & Consent
    isLegallyRegistered: false,
    consentToDisplay: false
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // On mount, try to fetch existing profile
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('http://localhost:5000/api/auth/institution-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data && response.data.institutionName) {
          setFormData(prev => ({ ...prev, ...response.data }));
          setIsEditMode(true);
        }
      } catch (error) {
        // If 404, it's fine (means no profile yet)
        if (error.response && error.response.status !== 404) {
          console.error('Error fetching institution profile:', error);
        }
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'counselingServices' || name === 'targetAgeGroups' || name === 'languages') {
        setFormData(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'location') {
          formDataObj.append('location', JSON.stringify(formData.location));
        } else if (Array.isArray(formData[key])) {
          formDataObj.append(key, JSON.stringify(formData[key]));
        } else if (typeof formData[key] === 'boolean') {
          formDataObj.append(key, formData[key].toString());
        } else {
          formDataObj.append(key, formData[key]);
        }
      });
      let response;
      if (isEditMode) {
        response = await axios.put(
          'http://localhost:5000/api/auth/edit-institution-profile',
          formDataObj,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/auth/create-institution-profile',
          formDataObj,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      if (response.data) {
        alert(isEditMode ? 'Profile updated successfully!' : 'Profile created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile save error:', error.response || error);
      if (error.response) {
        const { data } = error.response;
        if (data.message) {
          alert(`Error: ${data.message}`);
        } else {
          alert('Profile save failed. Please try again.');
        }
      } else if (error.request) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [lat, lng]
          }
        }));
      }
    });

    return formData.location.coordinates[0] !== 0 ? (
      <Marker position={formData.location.coordinates} />
    ) : null;
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <section className="form-step-section">
            <h3>Step 1: Institution Details</h3>
            <div className="form-questions">
              <input
                className='counseltext'
                type="text"
                name="institutionName"
                placeholder="Institution Name"
                value={formData.institutionName}
                onChange={handleChange}
                required
              />

              <input
                className='counseltext'
                type="text"
                name="registrationNumber"
                placeholder="Official Registration Number"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
              />

              <select name="yearsOfOperation" onChange={handleChange} required>
                <option value="">Years of Operation</option>
                <option value="less1">Less than 1 year</option>
                <option value="1-5">1–5 years</option>
                <option value="6-10">6–10 years</option>
                <option value="10+">10+ years</option>
              </select>

              <select name="institutionType" onChange={handleChange} required>
                <option value="">Institution Type</option>
                <option value="ngo">NGO / Non-profit</option>
                <option value="private">Private Counseling Practice</option>
                <option value="religious">Religious/Church-based Center</option>
                <option value="university">University Counseling Center</option>
                <option value="government">Government Clinic</option>
                <option value="other">Other</option>
              </select>

              {formData.institutionType === 'other' && (
                <input
                  className='counseltext'
                  type="text"
                  name="otherInstitutionType"
                  placeholder="Specify Other Institution Type"
                  value={formData.otherInstitutionType}
                  onChange={handleChange}
                />
              )}
            </div>
          </section>
        );

      case 2:
        return (
          <section className="form-step-section">
            <h3>Step 2: Location & Contact</h3>
            <div className="form-questions">
              <div className="map-container">
                <h4>Physical Location</h4>
                <p>Click on the map to mark your location</p>
                <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                  <MapContainer
                    center={[0, 0]}
                    zoom={2}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker />
                  </MapContainer>
                </div>
                <input
                  type="text"
                  name="location.address"
                  placeholder="Enter your address"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: e.target.value
                    }
                  }))}
                />
              </div>

              <input
                className='counseltext'
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />

              <input
                className='counseltext'
                type="url"
                name="website"
                placeholder="Website (optional)"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </section>
        );

      case 3:
        return (
          <section className="form-step-section">
            <h3>Step 3: Services Offered</h3>
            <div className="form-questions">
              <div className="checkbox-group">
                <label>Counseling Services Provided:</label>
                {COUNSELING_SERVICES.map(service => (
                  <div key={service}>
                    <input
                      type="checkbox"
                      name="counselingServices"
                      value={service}
                      checked={formData.counselingServices.includes(service)}
                      onChange={handleChange}
                    />
                    <label>{service}</label>
                  </div>
                ))}
                <input
                  className='ol'
                  type="text"
                  name="otherCounselingService"
                  placeholder="Other Services"
                  value={formData.otherCounselingService}
                  onChange={handleChange}
                />
              </div>

              <div className="checkbox-group">
                <label>Target Age Groups:</label>
                {[
                  ['children', 'Children (3–12)'],
                  ['adolescents', 'Adolescents (13–17)'],
                  ['youngAdults', 'Young Adults (18–35)'],
                  ['adults', 'Adults (36–60)'],
                  ['seniors', 'Seniors (61+)']
                ].map(([value, label]) => (
                  <div key={value}>
                    <input
                      type="checkbox"
                      name="targetAgeGroups"
                      value={value}
                      checked={formData.targetAgeGroups.includes(value)}
                      onChange={handleChange}
                    />
                    <label>{label}</label>
                  </div>
                ))}
              </div>

              <div className="checkbox-group">
                <label>Languages Supported:</label>
                {[
                  ['English', 'English'],
                  ['Swahili', 'Swahili']
                ].map(([value, label]) => (
                  <div key={value}>
                    <input
                      type="checkbox"
                      name="languages"
                      value={value}
                      checked={formData.languages.includes(value)}
                      onChange={handleChange}
                    />
                    <label>{label}</label>
                  </div>
                ))}
                <input
                  className='ol'
                  type="text"
                  name="otherLanguage"
                  placeholder="Other languages"
                  value={formData.otherLanguage}
                  onChange={handleChange}
                />
              </div>

              <div className="radio-group">
                <label>Do you offer virtual counseling sessions?</label>
                {[
                  ['yes', 'Yes'],
                  ['no', 'No']
                ].map(([value, label]) => (
                  <div key={value}>
                    <input
                      type="radio"
                      name="virtualCounseling"
                      value={value}
                      checked={formData.virtualCounseling === value}
                      onChange={handleChange}
                    />
                    <label>{label}</label>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 4:
        return (
          <section className="form-step-section">
            <h3>Step 4: Staff & Capacity</h3>
            <div className="form-questions">
              <input
                className='counseltext'
                type="number"
                name="numberOfCounselors"
                placeholder="Number of Licensed Counselors Staffed"
                value={formData.numberOfCounselors}
                onChange={handleChange}
                min="1"
                required
              />

              <select name="waitTime" onChange={handleChange} required>
                <option value="">Average Wait Time for Appointments</option>
                <option value="sameWeek">Same week</option>
                <option value="1-2weeks">1–2 weeks</option>
                <option value="3+weeks">3+ weeks</option>
              </select>
            </div>
          </section>
        );

      case 5:
        return (
          <section className="form-step-section">
            <h3>Step 5: Ethics, Verification & Consent</h3>
            <div className="form-questions">
              <div className="checkbox-group">
                <div>
                  <input
                    type="checkbox"
                    name="isLegallyRegistered"
                    checked={formData.isLegallyRegistered}
                    onChange={handleChange}
                    required
                  />
                  <label>I confirm this institution is legally registered and compliant with relevant counseling regulations.</label>
                </div>

                <div>
                  <input
                    type="checkbox"
                    name="consentToDisplay"
                    checked={formData.consentToDisplay}
                    onChange={handleChange}
                    required
                  />
                  <label>I consent to the platform displaying the institution publicly for matching purposes.</label>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-split-layout">
        {/* Left side - Hero section */}
        <div className="auth-hero counselor-hero">
          <img src={signupImage} alt="Supportive hands" />
          <div className="auth-hero-content">
            <h1>Complete Your Profile</h1>
            <p>Join our network of mental health institutions</p>
          </div>
        </div>

        {/* Right side - Profile Form */}
        <div className="auth-form-container">
          <div className="auth-form-content counselor">
            <h2>Institution Details</h2>
            <div className="progress-indicator">
              {[1, 2, 3, 4, 5].map((dotStep) => (
                <div 
                  key={dotStep} 
                  className={`step-dot ${step === dotStep ? 'active' : ''}`}
                />
              ))}
            </div>
            <form onSubmit={handleSubmit} className="auth-form counselor-form">
              {renderStep()}
              <div className="form-navigation">
                {step > 1 && (
                  <button type="button" onClick={prevStep} className="auth-button secondary">
                    Previous
                  </button>
                )}
                {step < 5 ? (
                  <button type="button" onClick={nextStep} className="auth-button">
                    Next
                  </button>
                ) : (
                  <button type="submit" className="auth-button">
                    Submit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionProfile; 