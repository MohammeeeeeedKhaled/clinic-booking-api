const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const APIFeatures = require('../utils/apiFeatures');

/**
 * @desc    Create doctor profile
 * @route   POST /api/doctors
 * @access  Private (Doctor only)
 */
const createDoctorProfile = catchAsync(async (req, res, next) => {
    // 1. Check if the doctor profile already exists for this authenticated user
    const existingDoctor = await Doctor.findOne({ user: req.user._id });
    
    if (existingDoctor) {
        // Replace manual res.status with AppError
        return next(new AppError('Doctor profile already exists for this user account.', 400));
    }

    // 2. Extract profile fields from request body
    const { specialization, consultationFee, bio, availableDays, workingHours } = req.body;

    // 3. Create new doctor document linked to the authenticated user ID
    const newDoctor = await Doctor.create({
        user: req.user._id,
        specialization,
        consultationFee,
        bio,
        availableDays,
        workingHours,
    });

    // 4. Send successful response
    res.status(201).json({
        status: 'success',
        data: {
            doctor: newDoctor,
        },
    });
});

/**
 * @desc    Get all doctors with filtering, sorting, field selection, and pagination
 * @route   GET /api/doctors
 * @access  Public
 */
const getAllDoctors = catchAsync(async (req, res, next) => {
    // 1. Populate user details (name, email, phone) while omitting the password
    // Without awaiting, we can chain the query methods
    const baseQuery = Doctor.find().populate({
        path: 'user',
        select: 'name email phone',
    });

    // 2. Apply query manipulation pipeline via APIFeatures
    const features = new APIFeatures(baseQuery, req.query)
        .filter()
        .search()
        .sort()
        .limitFields()
        .paginate();

    // 3. Execute final query
    const doctors = await features.query;

    // 4. Send successful response
    res.status(200).json({
        status: 'success',
        results: doctors.length,
        data: {
            doctors,
        },
    });
});

module.exports = {
    createDoctorProfile,
    getAllDoctors
};