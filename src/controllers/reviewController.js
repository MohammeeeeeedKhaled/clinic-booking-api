const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const Appointment = require('../models/appointmentModel');

/**
 * @desc    Create a new review for a doctor
 * @route   POST /api/reviews
 * @access  Private (Patient only)
 */
exports.createReview = catchAsync(async (req, res, next) => {
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
        return next(
            new AppError('You can only review doctors after completing an appointment with them.', 403)
        );
    }

    // 2. Create the review document
    // (The unique compound index in Review schema prevents double-reviewing)
    // Any duplicate error (E11000) will be caught automatically by catchAsync and sent to the global handler
    const newReview = await Review.create({
        doctor: doctorId,
        patient: patientId,
        rating,
        review,
    });

    // 3. Send successful response
    res.status(201).json({
        status: 'success',
        data: {
            review: newReview,
        },
    });
});

/**
 * @desc    Get all reviews for a specific doctor
 * @route   GET /api/reviews/doctor/:doctorId
 * @access  Public
 */
// next is written even not used but it best practice
exports.getDoctorReviews = catchAsync(async (req, res, next) => {
    const { doctorId } = req.params;

    // 1. Fetch reviews and populate patient details
    const reviews = await Review.find({ doctor: doctorId })
        .populate({
            path: 'patient',
            select: 'name',
        })
        .sort('-createdAt');

    // 2. Send successful response
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        },
    });
});