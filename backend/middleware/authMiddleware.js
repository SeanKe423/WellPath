const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    console.log("Auth header:", authHeader); // Debug log

    if (!authHeader) {
      console.log("No Authorization header provided"); // Debug log
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Handle both formats: "Bearer token" and just "token" to reduce token errors
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    console.log("Extracted token:", token); // Debug log

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp < Date.now() / 1000) {
        console.log("Token expired"); // Debug log
        return res.status(401).json({ message: "Token has expired" });
      }
      
      // Add user from payload
      req.user = decoded;
      
      console.log("Decoded token:", decoded); // Debug log
      
      next();
    } catch (error) {
      console.error("Token verification failed:", error); // Debug log
      return res.status(401).json({ message: "Token is not valid" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error); // Debug log
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = authMiddleware;
