//Signup Controller, Login Controller, Password Hashing, JWT Token Generation

const User = require('../models/User');
const Institution = require('../models/Institution');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Checks if institution, user or admin already exist
    let user = await Institution.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let adminUser = await Admin.findOne({ email });
    if (adminUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user based on role
    if (role === 'institution') {
      // For institutions, only the basic authentication info is created
      user = new Institution({
        email,
        password: hashedPassword,
        // Set default values for required fields. The rest of the profile is completed in the profile creation step
        institutionName: 'Pending',
        representativeName: name || 'Pending',
        registrationNumber: 'Pending',
        yearsOfOperation: 'less1',
        institutionType: 'private',
        location: {
          coordinates: [0, 0],
          address: 'Pending'
        },
        phoneNumber: 'Pending',
        virtualCounseling: 'no',
        numberOfCounselors: 1,
        waitTime: 'sameWeek',
        isLegallyRegistered: false,
        consentToDisplay: false,
        profileCompleted: false
      });
    } else {
      user = new User({
        name,
        email,
        password: hashedPassword
      });
    }

    await user.save();

    // Create JWT tokens for signup
    const payload = {
      id: user.id,
      role: role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      role: role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Checks if it's an admin user
    let user = await Admin.findOne({ email, isActive: true });
    let userRole = 'admin';

    // If not admin, checks if it's an institution
    if (!user) {
      user = await Institution.findOne({ email });
      userRole = 'institution';
    }

    // If not institution, checks if it's a regular user
    if (!user) {
      user = await User.findOne({ email });
      userRole = 'user';
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify role matches
    if (role && role !== userRole) {
      return res.status(400).json({ message: 'Invalid role for this user' });
    }

    // Update lastLogin for admin users
    if (userRole === 'admin') {
      await Admin.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    // Create JWT tokens for login
    const payload = {
      id: user.id,
      role: userRole
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send response with token and role to the frontend
    res.json({
      token,
      role: userRole,
      profileCompleted: user.profileCompleted || false
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    console.log('Request received for user profile');
    console.log('User from token:', req.user);
    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);

    let user;
    if (req.user.role === 'admin') {
      console.log('Searching in Admin collection');
      user = await Admin.findById(req.user.id);
    } else if (req.user.role === 'institution') {
      console.log('Searching in Institution collection');
      user = await Institution.findById(req.user.id);
    } else {
      console.log('Searching in User collection');
      user = await User.findById(req.user.id);
    }
    
    if (!user) {
      console.log('User not found in database');
      console.log('Searched ID:', req.user.id);
      return res.status(404).json({ 
        message: 'User not found',
        searchedId: req.user.id,
        searchedRole: req.user.role 
      });
    }

    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack 
    });
  }
}; 