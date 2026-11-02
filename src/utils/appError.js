/**
 * @desc    Custom Error class to standardise operational errors throughout the application
 * @extends Error
 */
class AppError extends Error {
    constructor(message, statusCode) {
        // 1. Call the parent class constructor (Error) with the message
        super(message);

        // 2. Set the HTTP status code (e.g., 400, 401, 404, 500)
        this.statusCode = statusCode;

        // 3. Determine the status string based on the status code
        // 'fail' for client errors (4xx), 'error' for server errors (5xx)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        // 4. Mark this error as 'operational' (expected errors like invalid input or unauthenticated)
        // This helps us distinguish between our own predictable errors and unexpected programming bugs
        this.isOperational = true;

        // 5. Capture the stack trace to exclude this constructor call from it, making debugging cleaner
        Error.captureStackTrace(this, this.constructor);//this refers Current instance of AppError class, this.constructor refers to the constructor function of the current instance, which is AppError. By passing these two arguments to Error.captureStackTrace, we ensure that the stack trace starts from the point where the error was created, rather than including the constructor call itself in the stack trace.
    }
}

module.exports = AppError;