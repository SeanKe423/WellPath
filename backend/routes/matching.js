const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { findMatches } = require('../services/matchingService');

// Get matches for a user (pure compatibility, stateless)
router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all approved institutions
    const institutions = await Institution.find({ approvalStatus: 'approved' });
    
    // Find matches using the matching service
    const matches = await findMatches(user, institutions);
    
    res.json({ matches });
  } catch (error) {
    console.error('Error in matches route:', error);
    res.status(500).json({ message: 'Error finding matches' });
  }
});

module.exports = router; 