const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { findMatches } = require('../services/matchingService');

// Get matches for a user (pure compatibility, stateless)
router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const institutions = await Institution.find({ profileCompleted: true });
    if (institutions.length === 0) {
      return res.status(404).json({ message: 'No institutions available for matching' });
    }
    // Use your matching service to compute compatibility
    const matches = findMatches(user, institutions);
    // Format and return the matches (no DB persistence)
    const formattedMatches = matches.map(match => ({
      institution: {
        id: match.institution._id,
        name: match.institution.institutionName,
        email: match.institution.email,
        counselingServices: match.institution.counselingServices || [],
        languages: match.institution.languages || [],
        location: match.institution.location || {},
        waitTime: match.institution.waitTime,
        virtualCounseling: match.institution.virtualCounseling,
        numberOfCounselors: match.institution.numberOfCounselors,
        yearsOfOperation: match.institution.yearsOfOperation,
        targetAgeGroups: match.institution.targetAgeGroups || [],
        institutionType: match.institution.institutionType
      },
      matchQuality: match.matchQuality,
      scores: match.scores
    }));
    res.json({ matches: formattedMatches });
  } catch (error) {
    res.status(500).json({ message: 'Error finding matches', error: error.message });
  }
});

module.exports = router; 