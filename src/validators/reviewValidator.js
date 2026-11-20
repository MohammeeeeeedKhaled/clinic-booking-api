const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');

/**
 * @desc    Validation rules for submitting a doctor review (POST /api/reviews)
 */
exports.createReviewValidator = [
    body('doctor')
        .notEmpty()
        .withMessage('Review must belong to a doctor.')
        .isMongoId()
        .withMessage('Invalid doctor ID format'),

    body('review')
        .trim()
        .notEmpty()
        .withMessage('Review text cannot be empty.')
        .isLength({ max: 500 })
        .withMessage('Review cannot exceed 500 characters.'),

    body('rating')
        .notEmpty()
        .withMessage('A review must have a rating.')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be a number between 1.0 and 5.0.'),

    validate,
];