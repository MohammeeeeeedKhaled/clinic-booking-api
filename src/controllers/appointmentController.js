const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * @desc    Book a new appointment with validation checks
 * @route   POST /api/appointments
 * @access  Private (Patients only)
 */
const bookAppointment = catchAsync(async (req, res, next) => {
    const { doctorId, date, timeSlot } = req.body;
    const patientId = req.user._id;

    // 1. Verify doctor existence
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        return next(new AppError('Doctor not found with this ID.', 404));
    }

    // 2. Validate requested day against doctor available days
    const appointmentDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const requestedDay = dayNames[appointmentDate.getUTCDay()];

    if (!doctor.availableDays.includes(requestedDay)) {
        return next(
            new AppError(`Doctor is not available on ${requestedDay}. Available days: ${doctor.availableDays.join(', ')}`, 400)
        );
    }

    // 3. Validate time slot within operating hours
    if (
        timeSlot < doctor.workingHours.start ||
        timeSlot >= doctor.workingHours.end
    ) {
        return next(
            new AppError(`Time slot must be between ${doctor.workingHours.start} and ${doctor.workingHours.end}.`, 400)
        );
    }

    // 4. Application-level check: ensure no active conflicting booking exists
    const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date: appointmentDate,
        timeSlot,
        status: { $ne: 'cancelled' },
    });

    if (existingAppointment) {
        return next(new AppError('This time slot is already booked for this doctor.', 400));
    }

    // 4.5. Ensure the PATIENT does not already have an active appointment at this date and time
    const existingPatientAppointment = await Appointment.findOne({
        patient: patientId,
        date: appointmentDate,
        timeSlot,
        status: { $ne: 'cancelled' },
    });

    if (existingPatientAppointment) {
        return next(
            new AppError('You already have another active appointment scheduled at this time.', 400)
        );
    }

    // 5. Create new appointment record
    const newAppointment = await Appointment.create({
        doctor: doctorId,
        patient: patientId,
        date: appointmentDate,
        timeSlot,
    });

    res.status(201).json({
        status: 'success',
        data: {
            appointment: newAppointment,
        },
    });
});
/**
 * @desc    Get appointments for the current logged-in user (doctor or patient)
 * @route   GET /api/appointments/my-appointments
 * @access  Private
 */
const getMyAppointments = catchAsync(async (req, res, next) => {
    let filter = {};

    // 1. Determine filter based on user role
    if (req.user.role === 'patient') {
        filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        
        // 2. Handle missing doctor profile using AppError
        if (!doctorProfile) {
            return next(new AppError('Doctor profile not found.', 404));
        }
        filter.doctor = doctorProfile._id;
    }

    // 3. Fetch and populate appointments
    const appointments = await Appointment.find(filter)
        .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name email phone' },
        })
        .populate('patient', 'name email phone')
        .sort({ date: 1, timeSlot: 1 });

    // 4. Send successful response
    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: {
            appointments,
        },
    });
});
/**
 * @desc    Cancel an appointment
 * @route   PATCH /api/appointments/:id/cancel
 * @access  Private
 */
const cancelAppointment = catchAsync(async (req, res, next) => {
    // 1. Find the appointment by ID
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('Appointment not found.', 404));
    }

    // 2. Authorization checks: 
    // Check if the user is either the patient who booked the appointment or the doctor assigned to it
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    
    let isDoctor = false;
    if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString()) {
            isDoctor = true;
        }
    }

    // If not patient, not the assigned doctor, and not an admin -> Forbidden
    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
        return next(new AppError('You are not authorized to cancel this appointment.', 403));
    }

    // 3. Update status and save
    appointment.status = 'cancelled';
    await appointment.save();

    // 4. Send response
    res.status(200).json({
        status: 'success',
        message: 'Appointment cancelled successfully.',
        data: {
            appointment,
        },
    });
});
/**
 * @desc    Mark an appointment as completed and attach clinical notes (Doctor only)
 * @route   PATCH /api/appointments/:id/complete
 * @access  Private (Doctor)
 */
const completeAppointment = catchAsync(async (req, res, next) => {
    const { diagnosis, prescription } = req.body;

    // 1. Retrieve the doctor profile linked to the authenticated user
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (!doctorProfile) {
        return next(new AppError('Only registered doctors can complete appointments.', 403));
    }

    // 2. Find the appointment by ID
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        return next(new AppError('Appointment not found.', 404));
    }

    // 3. Authorization check: ensure this appointment belongs to the calling doctor
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
        return next(new AppError('You are not authorized to complete this appointment.', 403));
    }

    // 4. State validation: appointment must not be cancelled or already completed
    if (appointment.status === 'cancelled') {
        return next(new AppError('Cannot complete a cancelled appointment.', 400));
    }

    if (appointment.status === 'completed') {
        return next(new AppError('Appointment is already completed.', 400));
    }

    // 5. Update appointment status and clinical records
    appointment.status = 'completed';
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (prescription) appointment.prescription = prescription;

    await appointment.save();

    // 6. Send successful response
    res.status(200).json({
        status: 'success',
        message: 'Appointment completed successfully.',
        data: {
            appointment,
        },
    });
});
module.exports = {
    bookAppointment,
    getMyAppointments,
    cancelAppointment,
    completeAppointment,
}