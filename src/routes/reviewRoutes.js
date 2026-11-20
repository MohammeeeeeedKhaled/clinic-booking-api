const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const { createReviewValidator } = require('../validators/reviewValidator');

// Get all reviews for a doctor (Public)
router.get(
    '/doctor/:doctorId',
    validateMongoId('doctorId'),
    reviewController.getDoctorReviews
);

// Add a review (Authenticated Patients only)
router.post(
    '/',
    protect,
    restrictTo('patient'),
    createReviewValidator,
    reviewController.createReview
);

module.exports = router;