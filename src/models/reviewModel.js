const mongoose = require('mongoose');
const Doctor = require('./doctorModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review text cannot be empty.'],
            trim: true,
            maxlength: [500, 'Review cannot exceed 500 characters.'],
        },
        rating: {
            type: Number,
            required: [true, 'A review must have a rating.'],
            min: [1, 'Rating must be at least 1.0.'],
            max: [5, 'Rating cannot exceed 5.0.'],
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: [true, 'Review must belong to a doctor.'],
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a patient.'],
        },
    },
    {
        timestamps: true,
    }
    );

// Prevent a patient from reviewing the same doctor multiple times
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

// Static method to calculate and persist doctor rating metrics
reviewSchema.statics.calcAverageRatings = async function (doctorId) {
    const stats = await this.aggregate([
        {
        $match: { doctor: doctorId },
        },
        {
        $group: {
            _id: '$doctor',
            nRating: { $sum: 1 },
            avgRating: { $avg: '$rating' },
        },
        },
    ]);

    if (stats.length > 0) {
        await Doctor.findByIdAndUpdate(doctorId, {
        ratingsQuantity: stats[0].nRating,
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        });
    } else {
        // Reset defaults if all reviews were deleted
        await Doctor.findByIdAndUpdate(doctorId, {
        ratingsQuantity: 0,
        averageRating: 0,
        });
    }
};

// Post-save middleware: recompute metrics on every new review
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.doctor);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;