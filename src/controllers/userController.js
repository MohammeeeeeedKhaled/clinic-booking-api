const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email',
      });
    }

    // Create user in DB (Password gets hashed automatically via pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken({ id: user._id }),
      },
    });
  } catch (error) {
    // Mongoose schema validation errors (Client error 400 -> fail)
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: error.message,
      });
    }

    // Unexpected system/database errors (Server error 500 -> error)
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both email and password',
      });
    }

    // Check user & explicitly select password because select: false was set in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchedPassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken({ id: user._id }),
      },
    });
  } catch (error) {
    // Unexpected system/database errors (Server error 500 -> error)
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};