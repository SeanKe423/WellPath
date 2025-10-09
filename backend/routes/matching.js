const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Feedback = require('../models/Feedback');
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

// Submit feedback about matches
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    const userId = req.user.id;

    // Create and save the feedback
    const feedback = new Feedback({
      userId,
      comment: comment.trim()
    });

    await feedback.save();

    res.status(200).json({ 
      message: 'Feedback received successfully',
      feedback: {
        id: feedback._id,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ message: 'Failed to save feedback' });
  }
});

// Get all feedback (admin only)
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view feedback' });
    }

    const feedback = await Feedback.find()
      .populate('userId', 'email') // Include user email for reference
      .sort({ createdAt: -1 }); // Most recent first

    res.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

module.exports = router; 