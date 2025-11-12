const express = require("express"); // Express framework for creating the server.
const mongoose = require("mongoose"); // ODM(Object Data Modeling) tool for MongoDB.
const dotenv = require("dotenv"); // Loads environment variables from .env.
const cors = require("cors"); // Cross-Origin Resource Sharing to allow requests from different origins.
const path = require("path");
const fs = require("fs"); // File system module for file operations.

// Load environment variables
dotenv.config();

const authRoutes = require("./routes/auth"); // Import auth routes from auth.js file
const matchingRoutes = require("./routes/matching"); // Import matching routes from matching.js file
const adminRoutes = require('./routes/admin'); // Import admin routes from admin.js file

const app = express(); // Create express application.

// Middleware
app.use(express.json()); // Parse JSON bodies.
app.use(cors()); // Enable cross-origin for all routes.

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes); //Whenever a request starts with /api/auth, it is sent to authRoutes. Line 12
app.use("/api/matching", matchingRoutes); 
app.use('/api/admin', adminRoutes);

// API test 
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      error: err.message
    });
  }

  res.status(500).json({ 
    message: "Something went wrong!", 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

