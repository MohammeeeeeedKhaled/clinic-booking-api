// ============================================================================
// 1. PROCESS-LEVEL ERROR HANDLER: UNCAUGHT EXCEPTIONS
// Must be placed at the very top before any other code executes to catch
// synchronous programming bugs outside Express (e.g., undefined variables).
// ============================================================================
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down gracefully...');
    console.error(err.name, err.message);
    process.exit(1);
});

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const connectDB = require('./config/db');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/errorMiddleware');

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Use extended query parser to handle nested query parameters like ?consultationFee[gte]=200
app.set('query parser', 'extended');

// ============================================================================
// 2. GLOBAL SECURITY MIDDLEWARES
// ============================================================================

// A. Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// B. Set security-related HTTP response headers (protects against clickjacking, sniffing, etc.)
app.use(helmet());

// C. Rate Limiting: Prevent Brute-Force & DDoS attacks
// Limits each IP to 100 requests per 15-minute window on /api routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
});
app.use('/api', apiLimiter);

// D. Body Parser with Payload Size Limit (prevents large JSON payload DoS attacks)
app.use(express.json({ limit: '10kb' }));

// E. Data Sanitization against NoSQL Query Injection (Express 5 Safe)
// Recursively strips keys starting with '$' or containing '.' in-place without reassigning req.query
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    }
};

app.use((req, res, next) => {
    sanitizeObject(req.body);
    sanitizeObject(req.params);
    sanitizeObject(req.query);
    next();
});

// F. Prevent HTTP Parameter Pollution (HPP)
// Cleans up duplicate query parameters (e.g., ?sort=price&sort=rating)
// Whitelist fields that are allowed to appear multiple times in query strings
app.use(
    hpp({
        whitelist: ['specialization', 'consultationFee', 'availableDays'],
    })
);

// ============================================================================
// 3. MOUNT ROUTES
// ============================================================================
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running!',
        environment: process.env.NODE_ENV,
    });
});

// ============================================================================
// 4. UNHANDLED ROUTES (404 NOT FOUND)
// ============================================================================
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ============================================================================
// 5. GLOBAL ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use(globalErrorHandler);

// ============================================================================
// 6. START SERVER & HANDLE UNHANDLED PROMISE REJECTIONS
// ============================================================================
let server;

const startServer = async () => {
    await connectDB();
    server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();

// Catch asynchronous errors occurring outside Express (e.g., DB connection drop)
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message);

    // Close the server first to finish pending requests, then exit the process
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});