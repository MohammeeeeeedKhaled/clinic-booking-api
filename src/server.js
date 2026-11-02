require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();

// 1. Import error handling utilities
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/errorMiddleware');

// Use extended query parser to handle nested query parameters like ?consultationFee[gte]=200
app.set('query parser', 'extended'); 
const PORT = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use(express.json());

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success', 
        message: `Server is running!`, 
        environment: process.env.NODE_ENV
    });
});

// =======================================================================================
// ... (All your existing routes go here, e.g., app.use('/api/doctors', doctorRoutes)) ...
// 2. Catch-all for unhandled routes (404 Not Found)
// This MUST be placed after all defined routes
//  ,If the request reaches this point,
//  it means no router caught it
// =======================================================================================
app.use((req, res, next) => { //app.all('*', (req, res, next) =>  not work app.all
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// =====================================================================
// 3. Global Error Handling Middleware
// This MUST be the last middleware in the app 
// =====================================================================
app.use(globalErrorHandler);

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
startServer();