const AppError = require('../utils/appError');

/**
 * --------------------------------------------------------
 * Error Translators (Helper Functions)
 * --------------------------------------------------------
 */

// 1. Handle Invalid MongoDB IDs (e.g., invalid ObjectId in req.params)
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

// 2. Handle MongoDB Duplicate Fields (E11000)
// This replaces all the (error.code === 11000) blocks we removed from controllers!
const handleDuplicateFieldsDB = (err) => {
    // Extract the duplicated value from the Mongoose error object
    const value = err.keyValue ? Object.values(err.keyValue)[0] : 'Unknown value';
    const message = `Duplicate field value: '${value}'. Please use another value!`;
    return new AppError(message, 400);
};

// 3. Handle Mongoose Validation Errors (e.g., missing required fields)
const handleValidationErrorDB = (err) => {
    // Loop over all validation errors and combine their messages
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// 4. Handle invalid JWT signatures
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

// 5. Handle expired JWT tokens
const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

/**
 * --------------------------------------------------------
 * Main Global Error Handling Middleware
 * --------------------------------------------------------
 */
module.exports = (err, req, res, next) => {
    // Set default status code and status string if not provided
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // ==============================================================
    // DEVELOPMENT MODE: Send maximum error details for debugging
    // ==============================================================
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }

    // ==============================================================
    // PRODUCTION MODE: Send clean, safe error messages to the client
    // ==============================================================
    else if (process.env.NODE_ENV === 'production') {
        // Create a shallow copy of the error object
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.code = err.code;

        // --- Translation Layer ---
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        // --- Response Layer ---
        // A. Operational, trusted error: send mapped message to client
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
        }
        // B. Programming or other unknown error: don't leak error details
        else {
            // 1) Log the error so developers can fix it
            console.error('ERROR ', err);

            // 2) Send a generic, user-friendly message
            return res.status(500).json({
                status: 'error',
                message: 'Something went very wrong! Please try again later.',
            });
        }
    }
};