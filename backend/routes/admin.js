const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Institution = require('../models/Institution');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log('Admin middleware - User:', req.user);
  if (!req.user) {
    console.error('Admin middleware - No user found in request');
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    console.error('Admin middleware - Invalid role:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  console.log('Admin middleware - Access granted');
  next();
};

// Get all institutions (admin only)
router.get('/institutions', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Fetching institutions for admin');
    const institutions = await Institution.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    console.log(`Found ${institutions.length} institutions`);
    res.json({ institutions });
  } catch (error) {
    console.error('Error in /institutions route:', error);
    res.status(500).json({ 
      message: 'Error fetching institutions', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Approve an institution
router.put('/institutions/:id/approve', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Attempting to approve institution:', req.params.id);
    
    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      console.log('Institution not found:', req.params.id);
      return res.status(404).json({ message: 'Institution not found' });
    }

    console.log('Current institution status:', institution.approvalStatus);
    
    const updatedInstitution = await Institution.findByIdAndUpdate(
      req.params.id,
      { 
        approvalStatus: 'approved',
        isVerified: true
      },
      { new: true }
    );
    
    console.log('Institution approved successfully:', updatedInstitution._id);
    res.json({ message: 'Institution approved successfully', institution: updatedInstitution });
  } catch (error) {
    console.error('Error in approve route:', error);
    res.status(500).json({ 
      message: 'Error approving institution', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Reject an institution
router.put('/institutions/:id/reject', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Attempting to reject institution:', req.params.id);
    
    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      console.log('Institution not found:', req.params.id);
      return res.status(404).json({ message: 'Institution not found' });
    }

    console.log('Current institution status:', institution.approvalStatus);
    
    const updatedInstitution = await Institution.findByIdAndUpdate(
      req.params.id,
      { 
        approvalStatus: 'rejected'
      },
      { new: true }
    );
    
    console.log('Institution rejected successfully:', updatedInstitution._id);
    res.json({ message: 'Institution rejected successfully', institution: updatedInstitution });
  } catch (error) {
    console.error('Error in reject route:', error);
    res.status(500).json({ 
      message: 'Error rejecting institution', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 