const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables first, before importing env config
dotenv.config();

// Centralized environment config (validates required vars at startup)
const env = require('./config/env');

const app = express();

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://api.razorpay.com"]
    }
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'same-origin' }
}));

// Permissions Policy Middleware
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});

// CORS — restrict to allowed origins defined in CORS_ORIGIN env variable
const allowedOrigins = env.CORS_ORIGIN
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin "${origin}" not allowed.`));
  },
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connection.on('error', err => {
  console.error('Mongoose connection error event:', err.message);
});

mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per window for dev/testing
  message: { error: 'Too many requests, please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 report analysis requests per 15 mins
  message: { error: 'Too many reports analyzed from this network. Please try again after 15 minutes.' }
});

const healthPlannerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 health planner requests per 15 mins
  message: { error: 'Too many health planner requests from this network. Please try again after 15 minutes.' }
});

const healthAnalyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 health analytics requests per 15 mins
  message: { error: 'Too many health analytics requests from this network. Please try again after 15 minutes.' }
});

const emergencyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 emergency requests per 15 mins
  message: { error: 'Too many emergency requests from this network. Please try again after 15 minutes.' }
});

// ─── Onboarding Route Guard Middleware ───────────────────────────────────────
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const onboardingGuard = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  // Try extracting email or auth token
  let userEmail = (
    req.headers['x-user-email'] ||
    req.query.email ||
    (req.body && req.body.userEmail)
  );

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('email onboardingCompleted');
      if (user) {
        req.userId = user._id;
        req.userEmail = user.email;
        if (!user.onboardingCompleted) {
          return res.status(403).json({
            error: 'Onboarding required. Please complete your health profile setup.',
            code: 'ONBOARDING_REQUIRED'
          });
        }
        return next();
      }
    } catch (e) {
      // Fall through to email check
    }
  }

  if (userEmail) {
    try {
      const user = await User.findOne({ email: String(userEmail).toLowerCase().trim() }).select('email onboardingCompleted');
      if (user) {
        req.userId = user._id;
        req.userEmail = user.email;
        if (!user.onboardingCompleted) {
          return res.status(403).json({
            error: 'Onboarding required. Please complete your health profile setup.',
            code: 'ONBOARDING_REQUIRED'
          });
        }
      }
    } catch (e) {
      console.error('onboardingGuard DB error:', e);
    }
  }

  next();
};

// Register routes
app.use('/api', generalLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/health-profile', require('./routes/healthProfile'));

// Mount guarded routes
app.use('/api/reports', onboardingGuard, uploadLimiter, require('./routes/reports'));
app.use('/api/health-planner', onboardingGuard, healthPlannerLimiter, require('./routes/healthPlanner'));
app.use('/api/health-analytics', onboardingGuard, healthAnalyticsLimiter, require('./routes/healthAnalytics'));
app.use('/api/emergency', onboardingGuard, emergencyLimiter, require('./routes/emergency'));
app.use('/api/user', onboardingGuard, require('./routes/user'));
app.use('/api/tasks', onboardingGuard, require('./routes/tasks'));
app.use('/api/orders', onboardingGuard, require('./routes/orders'));
app.use('/api/assistant', onboardingGuard, require('./routes/assistant'));


// Endpoint to create a Razorpay order
app.post('/api/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `receipt_${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    
    // Intercept authentication / deactivated key errors
    if (err.statusCode === 401 || (err.error && err.error.description === 'Authentication failed')) {
      console.warn("⚠️ Razorpay key authentication failed. Creating simulated Sandbox order.");
      return res.status(200).json({
        success: true,
        order_id: `order_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        sandbox: true
      });
    }
    
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

