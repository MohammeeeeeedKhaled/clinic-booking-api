const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Appointment must belong to a doctor.'],
        },
        patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Appointment must belong to a patient.'],
        },
        date: {
        type: Date,
        required: [true, 'Please provide the appointment date.'],
        },
        timeSlot: {
        type: String,
        required: [true, 'Please provide the time slot (e.g., 10:00).'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:mm format.'],
        },
        status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
        },
        paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid',
        },
        diagnosis: {
            type: String,
            trim: true,
        },
        prescription: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

//Prevents double booking at the database level.
appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;   