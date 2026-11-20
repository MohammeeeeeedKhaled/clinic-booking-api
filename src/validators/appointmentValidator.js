const { body, param } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');

const TIME_24H_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * @desc    Validation rules for booking a new appointment (POST /api/appointments)
 */
exports.createAppointmentValidator = [
    body('doctor')
        .notEmpty()
        .withMessage('Appointment must belong to a doctor.')
        .isMongoId()
        .withMessage('Invalid doctor ID format'),

    body('date')
        .notEmpty()
        .withMessage('Please provide the appointment date.')
        .isISO8601()
        .withMessage('Please provide a valid date format (YYYY-MM-DD)')
        .custom((value) => {
            const inputDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (inputDate < today) {
                throw new Error('Appointment date cannot be in the past');
            }
            return true;
        }),

    body('timeSlot')
        .trim()
        .notEmpty()
        .withMessage('Please provide the time slot (e.g., 10:00).')
        .matches(TIME_24H_REGEX)
        .withMessage('Please provide a valid time in HH:mm format.'),

    validate,
];

/**
 * @desc    Validation rules for completing an appointment (PATCH /api/appointments/:id/complete)
 */
exports.completeAppointmentValidator = [
    param('id')
        .isMongoId()
        .withMessage('Invalid appointment ID format'),

    body('diagnosis')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Diagnosis cannot exceed 1000 characters'),

    body('prescription')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Prescription cannot exceed 1000 characters'),

    validate,
];