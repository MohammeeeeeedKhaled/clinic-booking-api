require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const PORT = process.env.PORT || 5000;
const userRoutes = require('./routes/userRoutes');
app.use(express.json());
// Mount routes
app.use('/api/users', userRoutes);
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success', 
        message: `Server is running!`, 
        environment: process.env.NODE_ENV
    });
});
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
startServer();