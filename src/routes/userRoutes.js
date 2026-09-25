const express = require('express');
const {
    registerUser,
    loginUser,
    getUserProfile,
} = require('../controllers/userController');

// Import authentication middleware
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (Authentication endpoints)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (Requires valid Bearer token)
// Control flow: Request -> protect middleware -> getUserProfile controller
router.get('/profile', protect, getUserProfile);

module.exports = router;