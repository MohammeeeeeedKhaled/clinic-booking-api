const Doctor = require('../models/doctorModel');
const APIFeatures = require('../utils/apiFeatures');
/**
 * @desc    Create doctor profile
 * @route   POST /api/doctors
 * @access  Private (Doctor only)
 */
const createDoctorProfile = async (req, res) => {
    try {
        // 1. Check if the doctor profile already exists for this authenticated user
        const existingDoctor = await Doctor.findOne({ user: req.user._id });
        if (existingDoctor) {
        return res.status(400).json({
            status: 'fail',
            message: 'Doctor profile already exists for this user account.',
        });
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

        res.status(201).json({
        status: 'success',
        data: {
            doctor: newDoctor,
        },
        });
    } catch (error) {
        res.status(400).json({
        status: 'fail',
        message: error.message,
        });
    }
};
/**
 * @desc    Get all doctors with filtering, sorting, field selection, and pagination
 * @route   GET /api/doctors
 * @access  Public
 */
const getAllDoctors = async (req, res) =>{
    try{
        // Populate user details (name, email, phone) while omitting the password
        const baseQuery = Doctor.find().populate({//without awaiting, we can chain the query methods
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

        res.status(200).json({
            status: 'success',
            results: doctors.length,
            data: {
                doctors,
            },
        });
    }catch(error){
        res.status(500).json({//in get if error occurs, it is a server error
            status: 'error',
            message: error.message,
    });
    }
}
module.exports = {
    createDoctorProfile,
    getAllDoctors
}