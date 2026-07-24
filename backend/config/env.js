/**
 * backend/config/env.js
 *
 * Centralized environment variable access for the MediGrid backend.
 * All process.env reads are done here once at startup.
 * Other modules should import from this file instead of reading
 * process.env directly (except dotenv.config() in script.js).
 *
 * Startup warnings are emitted for any missing required variables.
 */

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY',
];

const optional = [
  'PORT',
  'CORS_ORIGIN',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'MICROSOFT_TENANT_ID',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

// Emit warnings for missing required variables at startup
required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[ENV] FATAL: Required environment variable "${key}" is not set. The server may not function correctly.`);
  }
});

optional.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[ENV] WARNING: Optional environment variable "${key}" is not set.`);
  }
});

const env = {
  // Server
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN ||
    'http://localhost:5173,http://localhost:5174,https://medigrid.vercel.app,https://medigrid.gauravgoswami.me,https://medigrid.gauravgoswami.in',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medigrid',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,

  // AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Payments
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'mock',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'mock',

  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || 'common',

  // Email (SMTP)
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = env;
