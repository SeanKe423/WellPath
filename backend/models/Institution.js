const mongoose = require("mongoose");
const COUNSELING_SERVICES = require('../constants/counselingServices');

const counselorSchema = new mongoose.Schema({
  // User authentication fields
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Step 1: Institution Details
  institutionName: {
    type: String,
    required: true
  },
  representativeName: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  yearsOfOperation: {
    type: String,
    enum: ['less1', '1-5', '6-10', '10+'],
    required: true
  },
  institutionType: {
    type: String,
    enum: ['ngo', 'private', 'religious', 'university', 'government', 'other'],
    required: true
  },
  otherInstitutionType: {
    type: String
  },

  // Step 2: Location & Contact
  location: {
    coordinates: {
      type: [Number], // [latitude, longitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  website: {
    type: String
  },

  // Step 3: Services Offered
  counselingServices: [{
    type: String,
    enum: COUNSELING_SERVICES
  }],
  otherCounselingService: {
    type: String
  },
  targetAgeGroups: [{
    type: String,
    enum: ['children', 'adolescents', 'youngAdults', 'adults', 'seniors']
  }],
  languages: [{
    type: String
  }],
  otherLanguage: {
    type: String
  },
  virtualCounseling: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },

  // Step 4: Staff & Capacity
  numberOfCounselors: {
    type: Number,
    required: true,
    min: 1
  },
  waitTime: {
    type: String,
    enum: ['sameWeek', '1-2weeks', '3+weeks'],
    required: true
  },

  // Step 5: Ethics, Verification & Consent
  isLegallyRegistered: {
    type: Boolean,
    default: false,
    required: true
  },
  consentToDisplay: {
    type: Boolean,
    default: false,
    required: true
  },
  
  // Profile status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
counselorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Institution", counselorSchema);
