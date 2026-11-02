const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // Built-in Node.js module to convert callback-based functions to Promises
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * @desc    Verify JWT token and attach user to request object
 * @access  Internal Middleware
 */
const protect = catchAsync(async (req, res, next) => {
    let token;

    // 1. Getting token and check if it's there
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized, no token provided', 401));
    }

    // 2. Verification token
    // Using promisify ensures that decoding the token doesn't block the Node.js event loop
    // Any error thrown here (like expired or invalid token) will be directly caught by catchAsync
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
        return next(
            new AppError('The user belonging to this token no longer exists.', 401)
        );
    }

    // 4. Grant access to protected route
    req.user = currentUser;
    next();
});

/**
 * @desc    Restrict access based on specified roles
 * @access  Internal Middleware
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // Synchronous middleware doesn't need catchAsync, just pass the error to next()
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

module.exports = { protect, restrictTo };