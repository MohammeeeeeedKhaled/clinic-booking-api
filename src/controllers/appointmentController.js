const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');

/**
 * @desc    Book a new appointment with validation checks
 * @route   POST /api/appointments
 * @access  Private (Patients only)
 */
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, timeSlot } = req.body;
        const patientId = req.user._id;

        // 1. Verify doctor existence
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
        return res.status(404).json({
            status: 'fail',
            message: 'Doctor not found with this ID.',
        });
        }

        // 2. Validate requested day against doctor available days
        const appointmentDate = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const requestedDay = dayNames[appointmentDate.getUTCDay()];

        if (!doctor.availableDays.includes(requestedDay)) {
        return res.status(400).json({
            status: 'fail',
            message: `Doctor is not available on ${requestedDay}. Available days: ${doctor.availableDays.join(', ')}`,
        });
        }

        // 3. Validate time slot within operating hours
        if (
        timeSlot < doctor.workingHours.start ||
        timeSlot >= doctor.workingHours.end
        ) {
        return res.status(400).json({
            status: 'fail',
            message: `Time slot must be between ${doctor.workingHours.start} and ${doctor.workingHours.end}.`,
        });
        }

        // 4. Application-level check: ensure no active conflicting booking exists
        const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date: appointmentDate,
        timeSlot,
        status: { $ne: 'cancelled' },
        });

        if (existingAppointment) {
        return res.status(400).json({
            status: 'fail',
            message: 'This time slot is already booked for this doctor.',
        });
        }
        // 4.5. Ensure the PATIENT does not already have an active appointment at this date and time
            const existingPatientAppointment = await Appointment.findOne({
            patient: patientId,
            date: appointmentDate,
            timeSlot,
            status: { $ne: 'cancelled' },
            });

            if (existingPatientAppointment) {
            return res.status(400).json({
                status: 'fail',
                message: 'You already have another active appointment scheduled at this time.',
            });
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
    } catch (error) {
        // Handle database-level unique compound index conflict (E11000)
        if (error.code === 11000) {
        return res.status(400).json({
            status: 'fail',
            message: 'This slot was just booked by another user. Please choose another slot.',
        });
        }

        res.status(400).json({
        status: 'fail',
        message: error.message,
        });
    }
};
/**
 * @desc    Get appointments for the current logged-in user (doctor or patient)
 * @route   GET /api/appointments/my-appointments
 * @access  Private
 */
const getMyAppointments = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'patient') {
        filter.patient = req.user._id;
        } else if (req.user.role === 'doctor') {

        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (!doctorProfile) {
            return res.status(404).json({
            status: 'fail',
            message: 'Doctor profile not found.',
            });
        }
        filter.doctor = doctorProfile._id;
        }

        const appointments = await Appointment.find(filter)
        .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name email phone' },
        })
        .populate('patient', 'name email phone')
        .sort({ date: 1, timeSlot: 1 });

        res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: {
            appointments,
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
 * @desc    Cancel an appointment
 * @route   PATCH /api/appointments/:id/cancel
 * @access  Private
 */
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
        return res.status(404).json({
            status: 'fail',
            message: 'Appointment not found.',
        });
        }

        // check if the user is either the patient who booked the appointment or the doctor assigned to it
        const isPatient = appointment.patient.toString() === req.user._id.toString();
        
        let isDoctor = false;
        if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString()) {
            isDoctor = true;
        }
        }

        if (!isPatient && !isDoctor && req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'fail',
            message: 'You are not authorized to cancel this appointment.',
        });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({
        status: 'success',
        message: 'Appointment cancelled successfully.',
        data: {
            appointment,
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
 * @desc    Mark an appointment as completed and attach clinical notes (Doctor only)
 * @route   PATCH /api/appointments/:id/complete
 * @access  Private (Doctor)
 */
const completeAppointment = async (req, res) => {
    try {
        const { diagnosis, prescription } = req.body;

        // 1. Retrieve the doctor profile linked to the authenticated user
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (!doctorProfile) {
        return res.status(403).json({
            status: 'fail',
            message: 'Only registered doctors can complete appointments.',
        });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
        return res.status(404).json({
            status: 'fail',
            message: 'Appointment not found.',
        });
        }

        // 3. Authorization check: ensure this appointment belongs to the calling doctor
        if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to complete this appointment.',
            });
        }

        // 4. State validation: appointment must not be cancelled or already completed
        if (appointment.status === 'cancelled') {
        return res.status(400).json({
            status: 'fail',
            message: 'Cannot complete a cancelled appointment.',
        });
        }

        if (appointment.status === 'completed') {
        return res.status(400).json({
            status: 'fail',
            message: 'Appointment is already completed.',
        });
        }

        // 5. Update appointment status and clinical records
        appointment.status = 'completed';
        if (diagnosis) appointment.diagnosis = diagnosis;
        if (prescription) appointment.prescription = prescription;

        await appointment.save();

        res.status(200).json({
        status: 'success',
        message: 'Appointment completed successfully.',
        data: {
            appointment,
        },
        });
    } catch (error) {
        res.status(400).json({
        status: 'fail',
        message: error.message,
        });
    }
};
module.exports = {
    bookAppointment,
    getMyAppointments,
    cancelAppointment,
    completeAppointment,
}