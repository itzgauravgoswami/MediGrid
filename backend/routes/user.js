const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

const JWT_SECRET = process.env.JWT_SECRET;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extracts the authenticated user's email from the request.
 * Checks: Authorization Bearer token → x-user-email header → query.email
 * Returns null if no valid auth is present.
 */
async function getAuthenticatedEmail(req) {
  // 1. Prefer JWT Bearer token (most secure)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('email');
      if (user) return user.email;
    } catch (e) {
      // invalid token — fall through to other methods
    }
  }

  // 2. Fallback: x-user-email or query param (legacy support only)
  const legacyEmail = (req.headers['x-user-email'] || req.query.email || '').toLowerCase().trim();
  if (legacyEmail) return legacyEmail;

  return null;
}

// ─── GET /api/user/profile ────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);

    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const user = await User.findOne({ email: userEmail }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[GET /profile]', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ─── PUT /api/user/profile ────────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);

    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const updates = req.body || {};

    const sanitizedData = {
      name: sanitize(updates.name || updates.fullName || ''),
      fullName: sanitize(updates.fullName || updates.name || ''),
      phone: sanitize(updates.phone || ''),
      emergencyName: sanitize(updates.emergencyName || ''),
      emergencyPhone: sanitize(updates.emergencyPhone || ''),
      age: Number(updates.age) || undefined,
      gender: sanitize(updates.gender || ''),
      bloodGroup: sanitize(updates.bloodGroup || ''),
      heightCm: Number(updates.heightCm) || undefined,
      weightKg: Number(updates.weightKg) || undefined,
      allergies: sanitize(updates.allergies || ''),
      medicalConditions: sanitize(updates.medicalConditions || ''),
      currentMedicines: sanitize(updates.currentMedicines || '')
    };

    if (updates.profilePicture !== undefined) {
      sanitizedData.profilePicture = sanitize(updates.profilePicture);
    }

    // Only include settings if they were actually sent
    if (updates.settingsAutoSync !== undefined ||
        updates.settingsSmsWarnings !== undefined ||
        updates.settingsEForward !== undefined ||
        updates.settingsAnomalyScan !== undefined) {
      sanitizedData.settings = {
        autoSync: updates.settingsAutoSync ?? true,
        smsWarnings: updates.settingsSmsWarnings ?? true,
        emailForwarding: updates.settingsEForward ?? false,
        anomalyScan: updates.settingsAnomalyScan ?? true
      };
    }

    // Remove undefined fields so we don't overwrite existing values with empty strings
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined || sanitizedData[key] === '') {
        delete sanitizedData[key];
      }
    });

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user
    });
  } catch (err) {
    console.error('[PUT /profile]', err);
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// ─── POST /api/user/upload-photo ──────────────────────────────────────────────
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Upload buffer to Cloudinary using upload_stream helper
    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'medigrid_profiles' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadStream();
    const photoUrl = cloudinaryResult.secure_url;

    // Update user model profilePicture
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { profilePicture: photoUrl } },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully!',
      photoUrl,
      user
    });
  } catch (err) {
    console.error('[POST /upload-photo]', err);
    return res.status(500).json({ error: 'Failed to upload photo.' });
  }
});

// ─── PUT /api/user/change-password ─────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { oldPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check old password if user has password set
    if (user.password) {
      const isMatch = await bcrypt.compare(String(oldPassword).trim(), user.password);
      const isLegacyMatch = !user.password.startsWith('$2') && user.password === String(oldPassword).trim();
      
      if (!isMatch && !isLegacyMatch) {
        return res.status(400).json({ error: 'Incorrect old password.' });
      }
    }

    user.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.error('[PUT /change-password]', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─── DELETE /api/user/account ──────────────────────────────────────────────────
router.delete('/account', async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete your account.' });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify password on backend using bcrypt
    const isMatch = await bcrypt.compare(String(password).trim(), user.password);
    const isLegacyMatch = !user.password.startsWith('$2') && user.password === String(password).trim();
    if (!isMatch && !isLegacyMatch) {
      return res.status(400).json({ error: 'Incorrect account password.' });
    }

    const userId = user._id;

    // Delete user data from all related collections
    const HealthProfile = require('../models/HealthProfile');
    const VitalsLog = require('../models/VitalsLog');
    const Task = require('../models/Task');
    const Analysis = require('../models/Analysis');
    const HealthPlan = require('../models/HealthPlan');
    const ChatSession = require('../models/ChatSession');
    const EmergencyLog = require('../models/EmergencyLog');

    await Promise.all([
      User.deleteOne({ _id: userId }),
      HealthProfile.deleteOne({ userId }),
      VitalsLog.deleteMany({ userEmail }),
      Task.deleteMany({ userEmail }),
      Analysis.deleteMany({ userEmail }),
      HealthPlan.deleteMany({ userId: userEmail }), // Uses email as key
      ChatSession.deleteMany({ userId }),
      EmergencyLog.deleteMany({ userEmail })
    ]);

    return res.status(200).json({ success: true, message: 'Your account has been permanently deleted.' });
  } catch (err) {
    console.error('[DELETE /account]', err);
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// POST /api/user/upgrade - Upgrades account to Premium
router.post('/upgrade', async (req, res) => {
  try {
    const userEmail = await getAuthenticatedEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { isPremium: true } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Account upgraded to Premium successfully!',
      user
    });
  } catch (err) {
    console.error('[POST /upgrade]', err);
    return res.status(500).json({ error: 'Failed to upgrade account.' });
  }
});

module.exports = router;
