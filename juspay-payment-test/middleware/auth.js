const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        jwt.verify(token, process.env.JWT_SECRET || 'glocoin_secret_key_2025', (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }
            
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Authorization token required'
        });
    }
};

/**
 * Admin Authentication Middleware
 */
const authenticateAdmin = (req, res, next) => {
    authenticateJWT(req, res, (jwtError) => {
        if (jwtError) {
            return;
        }
        
        // In a real app, you'd check user role from database
        // For demo purposes, we'll allow all authenticated users
        next();
    });
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is valid, but doesn't reject if missing
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, process.env.JWT_SECRET || 'glocoin_secret_key_2025', (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    
    next();
};

module.exports = {
    authenticateJWT,
    authenticateAdmin,
    optionalAuth
};
