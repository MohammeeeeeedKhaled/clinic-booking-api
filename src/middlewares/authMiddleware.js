const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// @desc    Verify JWT token and attach user to request object
// @access  Internal Middleware
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
    try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists.',
            });
        }

        return next();
    } catch (error) {
            return res.status(401).json({
            status: 'fail',
            message: 'Not authorized, token failed or expired',
        });
    }
    }

    if (!token) {
    return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, no token provided',
    });
    }
};

// @desc    Restrict access based on specified roles
// @access  Internal Middleware
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action',
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };