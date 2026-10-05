const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
router.post(
    '/',
    protect,
    restrictTo('patient'),
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
    appointmentController.cancelAppointment
);
// Compelete a specific appointment by its ID
router.patch(
    '/:id/complete',
    protect,
    restrictTo('doctor'),
    appointmentController.completeAppointment
);
module.exports = router;