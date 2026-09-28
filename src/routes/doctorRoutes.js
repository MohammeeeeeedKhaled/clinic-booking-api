const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public route to view all doctors
router.get('/', doctorController.getAllDoctors);

// Protected route: Only authenticated users with role 'doctor' can create their profile
router.post(
  '/',
  protect,
  restrictTo('doctor'),
  doctorController.createDoctorProfile
);

module.exports = router;