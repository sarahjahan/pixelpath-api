import jwt from "jsonwebtoken";

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded token payload (user info) to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

export default authenticateToken;
