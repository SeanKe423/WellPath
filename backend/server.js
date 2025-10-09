const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

const authRoutes = require("./routes/auth"); // Import auth routes
const matchingRoutes = require("./routes/matching"); // Add this line
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// Create uploads directory if it doesn't exist
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes); // Ensure this is present
app.use("/api/matching", matchingRoutes); // Add this line
app.use('/api/admin', adminRoutes);

// Add debug route to test API
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
