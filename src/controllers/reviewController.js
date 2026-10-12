const Review = require('../models/reviewModel');
const Appointment = require('../models/appointmentModel');

/**
 * @desc    Create a new review for a doctor
 * @route   POST /api/reviews
 * @access  Private (Patient only)
 */
exports.createReview = async (req, res) => {
    try {
        const { doctorId, rating, review } = req.body;
        const patientId = req.user._id;

        // 1. Business Logic Check:
        // Verify that the patient has at least one completed appointment with this doctor
        const completedAppointment = await Appointment.findOne({
        doctor: doctorId,
        patient: patientId,
        status: 'completed',
        });

        if (!completedAppointment) {
        return res.status(403).json({
            status: 'fail',
            message: 'You can only review doctors after completing an appointment with them.',
        });
        }

        // 2. Create the review document
        // (The unique compound index in Review schema prevents double-reviewing)
        const newReview = await Review.create({
        doctor: doctorId,
        patient: patientId,
        rating,
        review,
        });

        res.status(201).json({
        status: 'success',
        data: {
            review: newReview,
        },
        });
    } catch (error) {
        // Handle duplicate review index violation (E11000)
        if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: 'You have already submitted a review for this doctor.',
        });
        }

        res.status(400).json({
        status: 'fail',
        message: error.message,
        });
    }
};

/**
 * @desc    Get all reviews for a specific doctor
 * @route   GET /api/reviews/doctor/:doctorId
 * @access  Public
 */
exports.getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const reviews = await Review.find({ doctor: doctorId })
        .populate({
            path: 'patient',
            select: 'name',
        })
        .sort('-createdAt');

        res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        },
        });
    } catch (error) {
        res.status(400).json({
        status: 'fail',
        message: error.message,
        });
    }
};