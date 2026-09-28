const Doctor = require('../models/doctorModel');

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
 * @desc    Get all doctors with linked user details
 * @route   GET /api/doctors
 * @access  Public
 */
const getAllDoctors = async (req, res) =>{
    try{
        // const doctors = await Doctor.find().populate('user', 'name email phone');
        // Populate user details (name, email, phone) while omitting the password
        const doctors = await Doctor.find().populate({
            path: 'user',
            select: 'name email phone',
        });
        res.status(200).json({
            status: 'success',
            results: doctors.length,
            data: {
                doctors,
            },
        });
    }catch{
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