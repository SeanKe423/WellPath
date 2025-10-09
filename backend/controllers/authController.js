const User = require('../models/User');
const Institution = require('../models/Institution');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await Institution.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user based on role
    if (role === 'institution') {
      // For institutions, we only create the basic auth info
      // The rest of the profile will be completed in the profile creation step
      user = new Institution({
        email,
        password: hashedPassword,
        // Set default values for required fields
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
        upholdEthics: false,
        consentToDisplay: false,
        profileCompleted: false
      });
    } else {
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      });
    }

    await user.save();

    // Create JWT token
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

    // First check if it's an admin user
    let user = await User.findOne({ email, role: 'admin' });
    let userRole = 'admin';

    // If not admin, check institution
    if (!user) {
      user = await Institution.findOne({ email });
      userRole = 'institution';
    }

    // If not institution, check regular user
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

    // Create JWT token
    const payload = {
      id: user.id,
      role: userRole
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send response with token and role
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
    if (req.user.role === 'institution') {
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