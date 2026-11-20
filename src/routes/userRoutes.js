const express = require('express');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const {
    registerUser,
    loginUser,
    getUserProfile,
} = require('../controllers/userController');

// Import authentication middleware
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (Authentication endpoints)
router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);

// Protected routes (Requires valid Bearer token)
// Control flow: Request -> protect middleware -> getUserProfile controller
router.get('/profile', protect, getUserProfile);

module.exports = router;