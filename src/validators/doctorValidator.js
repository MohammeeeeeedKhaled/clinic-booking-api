const { body, param } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');

const TIME_24H_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const VALID_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

/**
 * @desc    Validation rules for creating a doctor profile
 */
exports.createDoctorValidator = [
    body('specialization')
        .trim()
        .notEmpty()
        .withMessage('Specialization is required'),

    body('consultationFee')
        .notEmpty()
        .withMessage('Consultation fee is required')
        .isFloat({ min: 0 })
        .withMessage('Fee cannot be negative'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio cannot exceed 1000 characters'),

    body('availableDays')
        .optional()
        .isArray({ min: 1 })
        .withMessage('availableDays must be a non-empty array of days'),

    body('availableDays.*')
        .isIn(VALID_DAYS)
        .withMessage('Invalid day name in availableDays'),

    body('workingHours.start')
        .trim()
        .notEmpty()
        .withMessage('Working start time is required')
        .matches(TIME_24H_REGEX)
        .withMessage('Please enter a valid 24-hour time format (HH:MM)'),

    body('workingHours.end')
        .trim()
        .notEmpty()
        .withMessage('Working end time is required')
        .matches(TIME_24H_REGEX)
        .withMessage('Please enter a valid 24-hour time format (HH:MM)')
        // Custom business logic check: shift end time must be after start time
        .custom((endTime, { req }) => {
            const startTime = req.body.workingHours?.start;
            if (startTime && endTime <= startTime) {
                throw new Error('Working end time must be after working start time');
            }
            return true;
        }),

    validate,
];

/**
 * @desc    Validation rules for updating a doctor profile
 */
exports.updateDoctorValidator = [
    param('id').isMongoId().withMessage('Invalid doctor ID format'),

    body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),

    body('consultationFee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Fee cannot be negative'),

    body('bio').optional().trim(),

    body('availableDays').optional().isArray({ min: 1 }),

    body('availableDays.*').optional().isIn(VALID_DAYS).withMessage('Invalid day name'),

    body('workingHours.start')
        .optional()
        .trim()
        .matches(TIME_24H_REGEX)
        .withMessage('Please enter a valid 24-hour time format (HH:MM)'),

    body('workingHours.end')
        .optional()
        .trim()
        .matches(TIME_24H_REGEX)
        .withMessage('Please enter a valid 24-hour time format (HH:MM)'),

    validate,
];