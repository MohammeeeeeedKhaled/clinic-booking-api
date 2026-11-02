const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/users/profile
 * @access  Private (Requires JWT via protect middleware)
 */
// This function is fully synchronous because the `protect` middleware 
// has already fetched the user from the DB and attached it to `req.user`. 
// Therefore, we do not need `async/await` nor `catchAsync` here.
const getUserProfile = (req, res) => {
  // The user document is already attached to 'req.user', we directly respond with it.
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  // 1. Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists with this email', 400));
  }

  // 2. Create user in DB (Password gets hashed automatically via pre-save hook)
  // Any Mongoose validation errors will be caught automatically by catchAsync
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
  });

  // 3. Send successful response with JWT token
  res.status(201).json({
    status: 'success',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken({ id: user._id }),
    },
  });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Validate email and password presence
  if (!email || !password) {
    return next(new AppError('Please provide both email and password', 400));
  }

  // 2. Check user & explicitly select password because select: false was set in schema
  const user = await User.findOne({ email }).select('+password');

  // 3. Verify password matches
  if (!user || !(await user.matchedPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 4. Send successful response with JWT token
  res.status(200).json({
    status: 'success',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken({ id: user._id }),
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};