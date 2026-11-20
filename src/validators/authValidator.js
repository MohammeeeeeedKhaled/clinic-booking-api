const { body } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');

// Exact regex patterns mirrored from userModel.js
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

/**
 * @desc    Validation rules for user registration
 */
exports.registerValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Enter Your Name')
        .isLength({ min: 3, max: 50 })
        .withMessage('Name must be between 3 and 50 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Enter Your email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Enter a password')
        .matches(PASSWORD_REGEX)
        .withMessage(
            'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character'
        ),

    body('role')
        .optional()
        // Restrict public registration to 'patient' or 'doctor' (prevents self-assigning 'admin')
        .isIn(['patient', 'doctor'])
        .withMessage('Role must be either patient or doctor'),

    body('phone')
        .optional()
        .trim()
        .matches(EGYPT_PHONE_REGEX)
        .withMessage('Please enter a valid 11-digit Egyptian phone number'),

    validate,
];

/**
 * @desc    Validation rules for user login
 */
exports.loginValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Enter Your email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Enter a password'),

    validate,
];