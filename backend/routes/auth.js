const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in .env. Authentication will not work correctly.');
}

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Upserts a user in MongoDB from verified OAuth data.
 * Returns { user, isNew }
 */
async function upsertOAuthUser({ email, name, picture, provider, providerId }) {
  const targetEmail = email.toLowerCase().trim();
  const targetName = sanitize(name || targetEmail.split('@')[0]);
  const targetPicture = picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`;
  const providerLower = provider.toLowerCase();

  let user = await User.findOne({ email: targetEmail });

  if (!user) {
    user = new User({
      email: targetEmail,
      name: targetName,
      fullName: targetName,
      authProvider: providerLower,
      providerId: String(providerId || ''),
      profilePicture: targetPicture,
      isVerified: true,
      lastLogin: new Date(),
      connectedProviders: [{
        provider: providerLower,
        providerId: String(providerId || ''),
        connectedAt: new Date()
      }]
    });
    await user.save();
    return { user, isNew: true };
  }

  // Existing user — update lastLogin, fill in missing fields, link provider
  user.lastLogin = new Date();
  if (!user.profilePicture && targetPicture) user.profilePicture = targetPicture;
  if (!user.fullName) user.fullName = targetName;
  if (!user.name || user.name === 'User') user.name = targetName;

  if (!Array.isArray(user.connectedProviders)) user.connectedProviders = [];
  const alreadyLinked = user.connectedProviders.find(p => p.provider === providerLower);
  if (!alreadyLinked) {
    user.connectedProviders.push({
      provider: providerLower,
      providerId: String(providerId || ''),
      connectedAt: new Date()
    });
  }

  await user.save();
  return { user, isNew: false };
}

function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name || user.fullName,
    fullName: user.fullName || user.name,
    email: user.email,
    authProvider: user.authProvider,
    profilePicture: user.profilePicture || '',
    connectedProviders: user.connectedProviders || [],
    lastLogin: user.lastLogin,
    needsPassword: !user.password,
    onboardingCompleted: user.onboardingCompleted || false
  };
}

// ─── POST /api/auth/signup-request ─────────────────────────────────────────────
router.post('/signup-request', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const cleanName = sanitize(name);

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Password strength check
    if (String(password).trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Hash the password for safety while pending
    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    // Upsert verification record
    await OtpVerification.findOneAndUpdate(
      { email: cleanEmail, type: 'register' },
      {
        name: cleanName,
        password: hashedPassword,
        otp,
        expiresAt,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send email
    await sendOtpEmail(cleanEmail, otp, 'register');

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your email address.'
    });
  } catch (err) {
    console.error('[signup-request]', err);
    return res.status(500).json({ error: 'Server error during signup request.' });
  }
});

// ─── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const verification = await OtpVerification.findOne({ email: cleanEmail, type: 'register' });

    if (!verification) {
      return res.status(400).json({ error: 'No pending registration request found or OTP expired. Please sign up again.' });
    }

    if (verification.expiresAt < new Date()) {
      await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (verification.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'Too many failed verification attempts. Please sign up again.' });
    }

    if (verification.otp !== String(otp).trim()) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({ error: `Invalid OTP. ${5 - verification.attempts} attempts remaining.` });
    }

    // OTP is valid! Let's check for race conditions where user signed up in the meantime
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'Account already exists. Please sign in.' });
    }

    // Create active user
    const newUser = new User({
      name: verification.name,
      fullName: verification.name,
      email: cleanEmail,
      password: verification.password, // already hashed
      authProvider: 'email',
      isVerified: true,
      onboardingCompleted: false,
      lastLogin: new Date()
    });

    await newUser.save();

    // Delete verification record
    await OtpVerification.deleteOne({ _id: verification._id });

    // Sign token
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created and verified successfully!',
      token,
      user: buildUserResponse(newUser)
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    return res.status(500).json({ error: 'Server error during OTP verification.' });
  }
});

// ─── POST /api/auth/resend-otp ─────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const verification = await OtpVerification.findOne({ email: cleanEmail, type });

    if (!verification) {
      return res.status(400).json({ error: 'No pending verification request found.' });
    }

    // 1 minute cooldown check
    const timeSinceLastSend = Date.now() - new Date(verification.updatedAt).getTime();
    if (timeSinceLastSend < 60000) {
      const secondsLeft = Math.ceil((60000 - timeSinceLastSend) / 1000);
      return res.status(429).json({ error: `Please wait ${secondsLeft} seconds before requesting another OTP.` });
    }

    // Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    verification.otp = otp;
    verification.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    verification.attempts = 0;
    
    await verification.save();

    // Send email
    await sendOtpEmail(cleanEmail, otp, type);

    return res.status(200).json({
      success: true,
      message: 'A new verification OTP has been sent to your email.'
    });
  } catch (err) {
    console.error('[resend-otp]', err);
    return res.status(500).json({ error: 'Server error during OTP resend.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
    }

    // Password verification supporting both legacy plain-text and new bcrypt hashes
    const isMatch = await bcrypt.compare(String(password).trim(), user.password);
    const isLegacyMatch = !user.password.startsWith('$2') && user.password === String(password).trim();

    if (!isMatch && !isLegacyMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Auto-migrate legacy plain-text passwords to bcrypt hashes on successful login
    if (isLegacyMatch) {
      user.password = await bcrypt.hash(String(password).trim(), 10);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// ─── POST /api/auth/social-login (Google + Microsoft — Implicit/Token flow) ──
router.post('/social-login', async (req, res) => {
  try {
    const { provider, token } = req.body;

    if (!provider || !token) {
      return res.status(400).json({ error: 'Provider and OAuth access token are required.' });
    }

    const providerLower = provider.toLowerCase();
    let oauthUser = null;

    if (providerLower === 'google') {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!googleRes.ok) {
        const err = await googleRes.text();
        console.error('[google-userinfo]', err);
        return res.status(401).json({ error: 'Google token is invalid or expired. Please try signing in again.' });
      }

      const googleData = await googleRes.json();
      if (!googleData.email) {
        return res.status(400).json({ error: 'Google did not return an email address. Ensure your Google account has a verified email.' });
      }

      oauthUser = {
        email: googleData.email,
        name: googleData.name || googleData.given_name || googleData.email.split('@')[0],
        picture: googleData.picture || '',
        provider: 'google',
        providerId: googleData.sub
      };

    } else if (providerLower === 'microsoft') {
      const msRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!msRes.ok) {
        const err = await msRes.text();
        console.error('[microsoft-graph]', err);
        return res.status(401).json({ error: 'Microsoft token is invalid or expired. Please try signing in again.' });
      }

      const msData = await msRes.json();
      const msEmail = msData.mail || msData.userPrincipalName;
      if (!msEmail) {
        return res.status(400).json({ error: 'Microsoft did not return an email address.' });
      }

      oauthUser = {
        email: msEmail,
        name: msData.displayName || msEmail.split('@')[0],
        picture: '',
        provider: 'microsoft',
        providerId: msData.id
      };

    } else {
      return res.status(400).json({ error: `Provider "${provider}" is not supported on this endpoint. GitHub uses /api/auth/github/callback.` });
    }

    const { user } = await upsertOAuthUser(oauthUser);
    const jwtToken = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Signed in with ${provider} successfully!`,
      token: jwtToken,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[social-login]', err);
    return res.status(500).json({ error: 'Server error during social authentication.' });
  }
});

// ─── POST /api/auth/forgot-password-request ────────────────────────────────────
router.post('/forgot-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in OtpVerification with type 'reset'
    await OtpVerification.findOneAndUpdate(
      { email: cleanEmail, type: 'reset' },
      {
        otp,
        expiresAt,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send email
    await sendOtpEmail(cleanEmail, otp, 'reset');

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email address.'
    });
  } catch (err) {
    console.error('[forgot-password-request]', err);
    return res.status(500).json({ error: 'Server error during forgot password request.' });
  }
});

// ─── POST /api/auth/verify-reset-otp ───────────────────────────────────────────
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const verification = await OtpVerification.findOne({ email: cleanEmail, type: 'reset' });

    if (!verification) {
      return res.status(400).json({ error: 'No pending password reset request found or OTP expired.' });
    }

    if (verification.expiresAt < new Date()) {
      await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (verification.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ error: 'Too many failed reset attempts. Please request a new OTP.' });
    }

    if (verification.otp !== String(otp).trim()) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({ error: `Invalid OTP. ${5 - verification.attempts} attempts remaining.` });
    }

    // OTP is valid! Generate a short-lived reset token signed by backend
    const resetToken = jwt.sign({ email: cleanEmail, verified: true }, JWT_SECRET, { expiresIn: '10m' });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (err) {
    console.error('[verify-reset-otp]', err);
    return res.status(500).json({ error: 'Server error during reset OTP verification.' });
  }
});

// ─── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
    }

    const cleanEmail = sanitize(email).toLowerCase();

    // Verify resetToken
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Reset token is invalid or expired. Please verify your OTP again.' });
    }

    if (decoded.email !== cleanEmail || !decoded.verified) {
      return res.status(401).json({ error: 'Reset token is invalid for this email.' });
    }

    // Validate new password strength
    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    user.password = hashedPassword;
    await user.save();

    // Invalidate OTP verification record
    await OtpVerification.deleteOne({ email: cleanEmail, type: 'reset' });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    console.error('[reset-password]', err);
    return res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// ─── POST /api/auth/set-oauth-password ─────────────────────────────────────────
router.post('/set-oauth-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { password } = req.body;
    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.password) {
      return res.status(400).json({ error: 'Password has already been set for this account.' });
    }

    user.password = await bcrypt.hash(String(password).trim(), 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Local password created successfully!'
    });
  } catch (err) {
    console.error('[set-oauth-password]', err);
    return res.status(500).json({ error: 'Server error setting local password.' });
  }
});

// ─── POST /api/auth/github/callback (GitHub — Authorization Code flow) ───────
// The frontend sends: { code } — the authorization code from GitHub's redirect.
// This route exchanges the code for a real access_token using the client secret,
// then fetches the user's profile from GitHub.
router.post('/github/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'GitHub authorization code is required.' });
    }

    if (!GITHUB_CLIENT_SECRET || GITHUB_CLIENT_SECRET === 'your_github_client_secret_here') {
      return res.status(500).json({ error: 'GITHUB_CLIENT_SECRET is not configured on the server. Please add it to backend/.env.' });
    }

    // Step 1: Exchange authorization code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[github-token-exchange]', tokenData);
      return res.status(401).json({
        error: `GitHub authorization failed: ${tokenData.error_description || tokenData.error}. The code may have expired — please try again.`
      });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'GitHub did not return an access token.' });
    }

    // Step 2: Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'MediGrid-Healthcare-App'
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Failed to retrieve GitHub user profile.' });
    }

    const githubUser = await userRes.json();
    let email = githubUser.email;

    // Step 3: Fetch primary email if profile email is private
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'MediGrid-Healthcare-App'
        }
      });

      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary = emails.find(e => e.primary && e.verified)
          || emails.find(e => e.verified)
          || emails[0];
        if (primary) email = primary.email;
      }
    }

    if (!email) {
      return res.status(400).json({
        error: 'Could not retrieve your email from GitHub. Please go to GitHub Settings → Emails and make your primary email public, then try again.'
      });
    }

    // Step 4: Upsert user and generate JWT
    const { user } = await upsertOAuthUser({
      email,
      name: githubUser.name || githubUser.login,
      picture: githubUser.avatar_url || '',
      provider: 'github',
      providerId: String(githubUser.id)
    });

    const jwtToken = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Signed in with GitHub successfully!',
      token: jwtToken,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[github-callback]', err);
    return res.status(500).json({ error: 'Server error during GitHub authentication.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user)
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
});

module.exports = router;
