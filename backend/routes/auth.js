const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Institution = require("../models/Institution");
const Admin = require("../models/Admin");
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected route for user profile
router.get('/user-profile', authMiddleware, authController.getUserProfile);

// Protected Route - Get User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user =
      req.user.role === "institution"
        ? await Institution.findById(req.user.id).select("-password")
        : await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Add this route for institution profile creation
router.post("/create-institution-profile", authMiddleware, async (req, res) => {
  try {
    console.log('Request received:', {
      body: req.body,
      files: req.files,
      user: req.user
    });

    const institutionId = req.user.id;

    // Verify the user is an institution
    if (req.user.role !== 'institution') {
      return res.status(403).json({ message: 'Access denied. Institution role required.' });
    }

    // Handle file upload if documents were included
    let documentUrl = null;
    if (req.files && req.files.documents) {
      const file = req.files.documents;
      const fileName = `${Date.now()}_${file.name}`;
      await file.mv(`./uploads/${fileName}`);
      documentUrl = `/uploads/${fileName}`;
    }

    // Parse arrays and objects from form data
    const updateData = {
      ...req.body,
      documents: documentUrl,
      profileCompleted: true
    };
    // Remove email if present in req.body
    delete updateData.email;

    // Parse JSON strings back to objects/arrays
    try {
      if (typeof updateData.location === 'string') {
        updateData.location = JSON.parse(updateData.location);
      }
      if (typeof updateData.counselingServices === 'string') {
        updateData.counselingServices = JSON.parse(updateData.counselingServices);
      }
      if (typeof updateData.targetAgeGroups === 'string') {
        const parsedAgeGroups = JSON.parse(updateData.targetAgeGroups);
        // Validate age groups against enum values
        const validAgeGroups = ['children', 'adolescents', 'youngAdults', 'adults', 'seniors'];
        updateData.targetAgeGroups = parsedAgeGroups.filter(group => validAgeGroups.includes(group));
        console.log('Parsed age groups:', updateData.targetAgeGroups);
      }
      if (typeof updateData.languages === 'string') {
        updateData.languages = JSON.parse(updateData.languages);
      }
    } catch (parseError) {
      console.error('Error parsing form data:', parseError);
      return res.status(400).json({ 
        message: "Error parsing form data",
        error: parseError.message 
      });
    }

    // Convert string booleans to actual booleans
    updateData.isLegallyRegistered = updateData.isLegallyRegistered === 'true';
    updateData.upholdEthics = updateData.upholdEthics === 'true';
    updateData.consentToDisplay = updateData.consentToDisplay === 'true';

    // Convert numberOfCounselors to number
    if (updateData.numberOfCounselors) {
      updateData.numberOfCounselors = parseInt(updateData.numberOfCounselors);
    }

    console.log('Update data:', updateData);

    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    res.json({
      message: "Profile created successfully",
      institution
    });

  } catch (error) {
    console.error("Profile creation error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Profile creation failed",
      error: error.message,
      stack: error.stack
    });
  }
});

// Create user profile route
router.post("/create-user-profile", authMiddleware, async (req, res) => {
  try {
    console.log('Creating user profile with data:', JSON.stringify(req.body, null, 2));
    const userId = req.user.id;

    // Verify user exists and is not an institution
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate required fields
    if (!req.body.ageGroup || !req.body.gender || !req.body.languages || !req.body.counselingServices || !req.body.severityLevel || !req.body.preferredMode) {
      return res.status(400).json({ 
        message: "Missing required fields",
        receivedData: req.body
      });
    }

    // Validate location data
    if (!req.body.location || !req.body.location.coordinates || !req.body.location.address) {
      return res.status(400).json({ 
        message: "Invalid location data",
        receivedLocation: req.body.location
      });
    }

    // Helper function to safely parse arrays
    const safeParseArray = (data) => {
      if (Array.isArray(data)) return data;
      try {
        return JSON.parse(data || '[]');
      } catch (e) {
        return [];
      }
    };

    // Update user profile
    const updateData = {
      ageGroup: req.body.ageGroup,
      gender: req.body.gender,
      languages: safeParseArray(req.body.languages),
      otherLanguage: req.body.otherLanguage,
      location: {
        type: 'Point',
        coordinates: req.body.location.coordinates,
        address: req.body.location.address
      },
      counselingServices: safeParseArray(req.body.counselingServices),
      otherCounselingService: req.body.otherCounselingService,
      severityLevel: req.body.severityLevel,
      preferredMode: safeParseArray(req.body.preferredMode),
      privacyPolicyConsent: req.body.privacyPolicyConsent,
      emergencyCareConsent: req.body.emergencyCareConsent,
      matchingConsent: req.body.matchingConsent,
      profileCompleted: true
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedUser) {
      console.error('User not found after update attempt');
      return res.status(404).json({ message: "User not found after update" });
    }

    console.log('Updated user:', JSON.stringify(updatedUser, null, 2));

    res.json({
      message: "Profile created successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Profile creation error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: "Profile creation failed",
      error: error.message,
      details: error.stack
    });
  }
});

// Get institution profile
router.get("/institution-profile", authMiddleware, async (req, res) => {
  try {
    const institutionId = req.user.id;
    const institution = await Institution.findById(institutionId).select('-password');
    
    if (!institution || !institution.profileCompleted || institution.institutionName === 'Pending') {
      return res.status(404).json({ message: "Institution not found" });
    }

    res.json(institution);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Edit user profile
router.put("/edit-user-profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ageGroup: req.body.ageGroup,
        gender: req.body.gender,
        languages: Array.isArray(req.body.languages) ? req.body.languages : JSON.parse(req.body.languages || '[]'),
        otherLanguage: req.body.otherLanguage,
        counselingServices: Array.isArray(req.body.counselingServices) ? req.body.counselingServices : JSON.parse(req.body.counselingServices || '[]'),
        otherCounselingService: req.body.otherCounselingService,
        currentIssues: Array.isArray(req.body.currentIssues) ? req.body.currentIssues : JSON.parse(req.body.currentIssues || '[]'),
        otherIssue: req.body.otherIssue,
        severityLevel: req.body.severityLevel,
        counselorGenderPreference: req.body.counselorGenderPreference
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
});

// Edit institution profile
router.put("/edit-institution-profile", authMiddleware, async (req, res) => {
  try {
    const institutionId = req.user.id;
    
    // Parse location if sent as a string
    if (typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }
    
    let documentUrl = undefined;
    if (req.files && req.files.documents) {
      const file = req.files.documents;
      const fileName = `${Date.now()}_${file.name}`;
      await file.mv(`./uploads/${fileName}`);
      documentUrl = `/uploads/${fileName}`;
    }

    const updateData = {
      institutionName: req.body.institutionName,
      registrationNumber: req.body.registrationNumber,
      yearsOfOperation: req.body.yearsOfOperation,
      institutionType: req.body.institutionType,
      location: {
        coordinates: req.body.location.coordinates || [0, 0],
        address: req.body.location.address
      },
      phoneNumber: req.body.phoneNumber,
      website: req.body.website,
      counselingServices: Array.isArray(req.body.counselingServices) ? req.body.counselingServices : JSON.parse(req.body.counselingServices || '[]'),
      otherCounselingService: req.body.otherCounselingService,
      targetAgeGroups: Array.isArray(req.body.targetAgeGroups) ? req.body.targetAgeGroups : JSON.parse(req.body.targetAgeGroups || '[]'),
      languages: Array.isArray(req.body.languages) ? req.body.languages : JSON.parse(req.body.languages || '[]'),
      otherLanguage: req.body.otherLanguage,
      virtualCounseling: req.body.virtualCounseling,
      numberOfCounselors: req.body.numberOfCounselors,
      waitTime: req.body.waitTime,
      numberOfInstitutions: req.body.numberOfInstitutions,
      isLegallyRegistered: req.body.isLegallyRegistered === 'true',
      upholdEthics: req.body.upholdEthics === 'true',
      consentToDisplay: req.body.consentToDisplay === 'true'
    };

    // Only add documentUrl if a new file was uploaded
    if (documentUrl) {
      updateData.documents = documentUrl;
    }

    // When updating, do not overwrite email
    const institution = await Institution.findByIdAndUpdate(
      institutionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    res.json({
      message: "Profile updated successfully",
      institution: institution
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
});

// Add this route to verify token validity
router.get("/verify-token", authMiddleware, (req, res) => {
  res.json({ valid: true });
});

// Add this route temporarily for testing
router.post('/create-test-institution', async (req, res) => {
  try {
    const testInstitution = new Institution({
      email: 'test.institution@example.com',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Test Institution',
      phoneNumber: '1234567890',
      gender: 'female',
      languages: ['English', 'Swahili'],
      education: 'masters',
      cpbNumber: 'CPB123',
      yearsExperience: '4-6',
      specializations: [
        'General Mental Health',
        'Relationship/Marital Counselling',
        'Family Counselling'
      ],
      profileCompleted: true,
      isVerified: true
    });

    await testInstitution.save();
    res.json({ message: 'Test institution created', institution: testInstitution });
  } catch (error) {
    console.error('Error creating test institution:', error);
    res.status(500).json({ message: 'Error creating test institution', error: error.message });
  }
});

// Create admin user (protected route - only accessible with admin secret)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;

    // Check admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email or username already exists' });
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new Admin({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

module.exports = router;
