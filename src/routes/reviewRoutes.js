const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Get all reviews for a doctor (Public)
router.get('/doctor/:doctorId', reviewController.getDoctorReviews);

// Add a review (Authenticated Patients only)
router.post(
    '/',
    protect,
    restrictTo('patient'),
    reviewController.createReview
);

module.exports = router;