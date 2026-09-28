const mongoose = require('mongoose');

// @desc    Doctor Profile Schema (1:1 relationship with User model)
const doctorSchema = new mongoose.Schema(
  {
    // 1:1 reference linking this profile to an authenticated User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A doctor profile must belong to a registered user.'],
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    bio: {
      type: String,
      trim: true,
    },
    availableDays: {
      type: [String],
      enum: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    },
// Daily shift window enforced via 24-hour time format validation
    workingHours: {
        start: {
            type: String,
            required: [true, 'Working start time is required'],
            trim: true,
            // Enforces strict HH:MM 24-hour time standard (00:00 - 23:59)
            match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Please enter a valid 24-hour time format (HH:MM)',
            ],
        },
        end: {
            type: String,
            required: [true, 'Working end time is required'],
            trim: true,
            match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Please enter a valid 24-hour time format (HH:MM)',
            ],
        },
    },
  },
  {
    // Automatically manages 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;