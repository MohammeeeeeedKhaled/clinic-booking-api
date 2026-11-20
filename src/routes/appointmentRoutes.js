const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { validateMongoId } = require('../validators/commonValidator');
const {
    createAppointmentValidator,
    completeAppointmentValidator,
} = require('../validators/appointmentValidator');

// Book a new appointment (Patients only)
router.post(
    '/',
    protect,
    restrictTo('patient'),
    createAppointmentValidator,
    appointmentController.bookAppointment
);

// Fetch bookings for the authenticated user (either patient or doctor)
router.get(
    '/my-appointments',
    protect,
    appointmentController.getMyAppointments
);

// Cancel a specific appointment by its ID
router.patch(
    '/:id/cancel',
    protect,
    validateMongoId('id'),
    appointmentController.cancelAppointment
);

// Complete a specific appointment by its ID (Doctors only)
router.patch(
    '/:id/complete',
    protect,
    restrictTo('doctor'),
    completeAppointmentValidator,
    appointmentController.completeAppointment
);

module.exports = router;