import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET, ADMIN_RECOVERY_KEY } from '../config/env.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Change Password Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
};

export const publicChangePassword = async (req, res) => {
  try {
    const { username, currentPassword, recoveryKey, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Username and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const cleanUser = username.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: cleanUser }, { email: cleanUser }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Admin account "${username}" was not found`,
      });
    }

    const masterKey = ADMIN_RECOVERY_KEY || 'brew2026admin';
    const providedVerification = (recoveryKey || currentPassword || '').trim();

    let isAuthorized = false;

    // Check 1: Master recovery key (for when previous password was forgotten)
    if (providedVerification && providedVerification === masterKey) {
      isAuthorized = true;
    }
    // Check 2: Current password match
    else if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (isMatch) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(400).json({
        success: false,
        message:
          'Verification failed. Enter your current password OR your Admin Recovery Key (found in server/.env).',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[Public Change Password Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password',
    });
  }
};


