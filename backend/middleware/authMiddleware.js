const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    console.log("Auth header:", authHeader); // Confirm that the frontend actually sent an Authorization header

    if (!authHeader) {
      console.log("No Authorization header provided");
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Handle both formats from frontend: "Bearer token" and just "token" to reduce token errors
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) // Remove "Bearer " prefix to remain with just the token
      : authHeader;

    console.log("Extracted token:", token); // Confirm that the "Bearer " prefix was extracted correctly

    try {
      // Verify token. Decodes the token to make sure the embedded information is valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp < Date.now() / 1000) {
        console.log("Token expired");
        return res.status(401).json({ message: "Token has expired" });
      }
      
      // Add user from payload.
      req.user = decoded;
      
      console.log("Decoded token:", decoded); // Debug log
      
      next();
    } catch (error) {
      console.error("Token verification failed:", error); // Catch tampered tokens/ their errors
      return res.status(401).json({ message: "Token is not valid" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error); 
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = authMiddleware;
