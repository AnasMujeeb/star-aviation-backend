const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token for a user.
 *
 * @param {string} id - User ObjectId
 * @returns {string} Signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/register
 * Register a new user.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Only admins can create admin accounts
    let assignedRole = role || 'staff';
    if (assignedRole === 'admin') {
      // If there's a requesting user (via token), check if they're admin
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const requestingUser = await User.findById(decoded.id);
          if (!requestingUser || requestingUser.role !== 'admin') {
            assignedRole = 'staff';
          }
        } catch {
          assignedRole = 'staff';
        }
      } else {
        // No token — check if any admin exists yet (first-time setup)
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
          assignedRole = 'staff';
        }
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user profile.
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
