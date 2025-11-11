const mongoose = require('mongoose');
const COUNSELING_SERVICES = require('../constants/counselingServices');

const userSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  // Profile fields
  ageGroup: {
    type: String,
    enum: ['children', 'adolescents', 'youngAdults', 'adults', 'seniors'],
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: false
  },
  languages: [{
    type: String
  }],
  otherLanguage: {
    type: String
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },

  // Counseling needs
  counselingServices: [{
    type: String,
    enum: COUNSELING_SERVICES
  }],
  otherCounselingService: {
    type: String
  },
  severityLevel: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    required: false
  },

  // Accessibility
  preferredMode: [{
    type: String,
    enum: ['in-person', 'online', 'no-preference']
  }],

  // Consent
  privacyPolicyConsent: {
    type: Boolean,
    default: false
  },
  emergencyCareConsent: {
    type: Boolean,
    default: false
  },
  matchingConsent: {
    type: Boolean,
    default: false
  },

  // Profile status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Additional fields
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'counselor', 'admin'],
    default: 'user'
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
