# MediGrid: Intelligent Clinical Care Coordination Platform

MediGrid is an enterprise-grade digital health orchestration and patient routing platform designed to unify medical document analysis, real-time vitals monitoring, emergency dispatch response, personalized health regimen generation, and pharmaceutical fulfillment into a cohesive, secure ecosystem.

The system is engineered as a decoupled full-stack architecture featuring a React 19 single-page application and an Express 5 REST API gateway powered by Google Gemini generative models, Tesseract OCR, MongoDB Atlas, and Razorpay payment integration.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Core Functional Modules](#core-functional-modules)
- [Technology Stack](#technology-stack)
- [Security and Compliance Architecture](#security-and-compliance-architecture)
- [Data Models and Schemas](#data-models-and-schemas)
- [API Reference](#api-reference)
- [Environment Configuration](#environment-configuration)
- [Installation and Setup](#installation-and-setup)
- [Deployment Configuration](#deployment-configuration)
- [Repository Structure](#repository-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Architectural Overview

MediGrid is architected with a separation of concerns across presentation, API routing, intelligence extraction, and persistence layers:

1. **Client Tier**: Built on React 19 and Vite with Tailwind CSS v4. Delivers sub-millisecond route transitions, interactive health dashboards, Leaflet-powered geospatial hospital routing, and responsive light/dark rendering.
2. **Gateway Tier**: Node.js and Express 5 server featuring Helmet-hardened security headers, strict Content Security Policies, Permissions-Policy enforcement, and differentiated rate limiting across traffic tiers.
3. **Clinical Intelligence Tier**: Deep integration with Google Gemini generative models utilizing adversarial prompt injection isolation barriers, structured JSON extraction schemas, and multi-modal report ingestion.
4. **Document Processing Pipeline**: In-memory Multer processing paired with dual-engine OCR (PDF-Parse for structured clinical lab PDFs and Tesseract.js for scanned physical prescriptions and imaging reports).
5. **Data Resilience Tier**: MongoDB Atlas backed by Mongoose with automatic, non-blocking local JSON fallback persistence (`localDb.json`, `localDb_healthPlans.json`, `localDb_emergencyLogs.json`) to guarantee zero-downtime execution in offline or intermittent development environments.

---

## System Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   React 19 Single Page Application (Vite 8, Tailwind CSS v4, Lucide Icons)      |
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | Auth & Onboarding  |  | Vitals & Analytics   |  | Medical Report Analyzer |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | Leaflet Geo Map    |  | Emergency SOS Mesh   |  | E-Pharmacy & Checkout   |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
+---------------------------------------+-----------------------------------------+
                                        |
                            HTTPS / JSON Web Tokens
                                        |
+---------------------------------------v-----------------------------------------+
|                               API GATEWAY LAYER                                 |
|   Node.js 18+ / Express 5 Application Gateway (Helmet, CORS, Rate Limiters)     |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | Middleware: JWT Verification | Onboarding Route Guard | Rate Limit Tiers   |  |
|  +---------------------------------------------------------------------------+  |
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | /api/auth          |  | /api/health-profile  |  | /api/reports (OCR/Multer|  |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | /api/emergency     |  | /api/health-planner  |  | /api/health-analytics   |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | /api/orders        |  | /api/assistant       |  | /api/user               |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
+-------------------+--------------------+--------------------+-------------------+
                    |                    |                    |
                    v                    v                    v
+-----------------------+ +--------------------+ +-------------------------------+
|  PERSISTENCE TIER     | | EXTERNAL SERVICES  | | AI & DOCUMENT PIPELINE        |
| - MongoDB Atlas       | | - Razorpay Gateway | | - Google Gemini Generative AI |
| - Mongoose ODM        | | - Cloudinary CDN   | | - Tesseract.js OCR Engine     |
| - Local JSON Fallback | | - Nodemailer SMTP  | | - PDF-Parse Binary Parser     |
+-----------------------+ +--------------------+ +-------------------------------+
```

---

## Core Functional Modules

### 1. Intelligent Medical Report Analyzer
- **Dual-Engine Ingestion**: Ingests clinical lab reports in PDF, JPEG, and PNG formats with a 20 MB payload ceiling.
- **In-Memory Buffer Processing**: Uploaded documents are parsed directly from memory without writing temporary unencrypted files to disk, upholding data security best practices.
- **OCR and Text Normalization**: Employs Tesseract.js for optical character recognition of scanned documents and `pdf-parse/node` for digital PDF streams, backed by serverless DOMMatrix and ImageData polyfills.
- **Clinical Biomarker Interpretation**: Evaluates lab values (CBC, metabolic panels, lipid profiles, glycemic markers) against standardized reference ranges.
- **Automated Summary and Recommendations**: Generates non-diagnostic patient summaries, highlights abnormal values, and suggests medical specialists for follow-up consultation.

### 2. Clinical Vitals Analytics and Trend Ingestion
- **Metric Tracking**: Records systolic/diastolic blood pressure, heart rate (BPM), blood glucose (mg/dL), blood oxygen saturation (SpO2 %), and Body Mass Index (BMI).
- **Statistical Health Scoring**: Computes aggregate cardiovascular, metabolic, and wellness index metrics.
- **Risk Stratification**: Automatically detects out-of-bounds readings and flags clinical risk levels (Normal, Elevated, Stage 1, Stage 2, Crisis).
- **Report Export**: Compiles historical telemetry into client-generated structured PDF health summaries via jsPDF.

### 3. Emergency SOS Dispatch and Facility Routing
- **Geolocated SOS Beacon**: Captures real-time latitude, longitude, and device accuracy data with a countdown cancellation failsafe.
- **Immediate Contact Notification**: Dispatches automated SMTP emergency notification emails to designated family or caregiver contacts with embedded coordinates and timestamped urgency assessments.
- **Symptom Urgency Evaluation**: Real-time AI classification assigning emergency severity ratings (CRITICAL, HIGH, MODERATE, LOW) and immediate first-aid precautions.
- **Geospatial Hospital Discovery**: Interactively visualizes local emergency rooms, trauma centers, and clinics via Leaflet and OpenStreetMap, providing routing distance, hotline direct dialing, and service classifications.

### 4. AI-Powered Personalized Health and Wellness Planner
- **Holistic Profile Synthesis**: Synthesizes age, gender, BMI, dietary preferences, existing medical conditions, and recent lab results into personalized regimens.
- **Targeted Care Plans**: Generates customized 7-day nutritional plans with macronutrient targets, hydration schedules, and mobility/exercise routines.
- **Interactive Daily Task Management**: Converts wellness goals into trackable daily adherence checklists synchronized with the user profile.

### 5. Verified E-Pharmacy and Transaction Gateway
- **Categorized Drug Directory**: Comprehensive repository of certified pharmaceuticals categorized by therapeutic classification (Fever and Pain, Heart Health, Diabetes Care, Antibiotics, Vitamins).
- **Cart and Prescription Handling**: Real-time cart calculations with itemized pricing, delivery fees, and order notes.
- **Secure Payment Processing**: Integrated with Razorpay order generation and verification endpoints, with automatic sandbox fallback handling for local or testing workflows.

### 6. Clinical Conversational Copilot
- **Voice and Text Multimodal Interface**: Supports hands-free audio transcription and real-time text consultation.
- **Safety Disclaimers**: Built-in adherence to non-diagnostic medical disclaimers, directing critical conditions to immediate emergency dispatchers.

### 7. Multi-Provider Authentication and Clinical Onboarding Gate
- **Dual Auth Strategies**: Email and password registration with bcryptjs password hashing (12 rounds) and JWT authentication, alongside OAuth 2.0 social sign-in (Google Identity, GitHub, Microsoft Azure AD).
- **Credential Recovery**: Email-delivered 6-digit OTP password reset workflow with 10-minute validity.
- **Enforced Onboarding Route Guard**: Prevents authenticated users from accessing sensitive clinical features until baseline medical profile configuration (allergies, emergency contacts, blood group) is finalized.

---

## Technology Stack

### Frontend Architecture
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 (`@vitejs/plugin-react`)
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Geospatial Mapping**: Leaflet 1.9, React-Leaflet 5, Leaflet MarkerCluster
- **Icons**: Lucide React
- **Client Document Generation**: jsPDF 4

### Backend Architecture
- **Runtime**: Node.js (v18.0.0 or higher)
- **Application Server**: Express 5
- **Database Driver**: Mongoose 9 / MongoDB Atlas
- **Security & Headers**: Helmet 8, Express Rate Limit 8, CORS
- **Authentication**: JSON Web Token (`jsonwebtoken` 9), bcryptjs 2.4
- **Document & Image Parsing**: Multer 2, Tesseract.js 7, `pdf-parse` 2.4
- **Payment Processing**: Razorpay Node SDK 2.9
- **Email Delivery**: Nodemailer 9 (SMTP via Gmail App Password)
- **Asset Storage**: Cloudinary SDK 2

---

## Security and Compliance Architecture

MediGrid implements defense-in-depth principles across all architectural tiers:

### 1. HTTP Security and Transport Hardening
- **Helmet Headers**: Injects hardened `Cross-Origin-Opener-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict `Referrer-Policy`.
- **Content Security Policy (CSP)**: Whitelists trusted script, style, and API origins (`https://generativelanguage.googleapis.com`, `https://api.razorpay.com`).
- **Permissions Policy**: Express middleware restricts client browser APIs: `camera=(), microphone=(), geolocation=(self)`.
- **CORS Whitelist**: Origin whitelisting governed by the `CORS_ORIGIN` environment variable.

### 2. Multi-Tier Rate Limiting
Granular rate-limiting strategies are deployed to prevent brute-force attacks and resource exhaustion:

| Route Path | Window | Threshold | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/*` | 15 minutes | 2,000 requests | General API gateway traffic limit |
| `/api/reports/*` | 15 minutes | 300 requests | OCR and report parsing resource protection |
| `/api/health-planner/*` | 15 minutes | 500 requests | AI regimen generation rate throttling |
| `/api/health-analytics/*` | 15 minutes | 600 requests | Vitals ingestion abuse prevention |
| `/api/emergency/*` | 15 minutes | 600 requests | Emergency dispatch endpoint integrity |

### 3. Adversarial Prompt Injection Defense
All interactions with Google Gemini generative models enforce a system-level isolation envelope:
- Treats all incoming user parameters strictly as patient narrative data.
- Explicitly rejects instructions attempting to alter persona, bypass system boundaries, extract API tokens, or execute code.
- Enforces strict structured JSON schema returns.

### 4. Input Sanitization
All inputs passed to emergency and health routers undergo regex-based sanitization stripping script vectors, arbitrary HTML tags, and ASCII control characters prior to database entry or LLM submission.

### 5. Serverless Polyfills
To resolve binary crashes within serverless environments (e.g., Vercel Lambda functions) running `pdf-parse` and `pdfjs-dist`, `script.js` injects global stubs for `DOMMatrix`, `ImageData`, and `Path2D` at process startup.

---

## Data Models and Schemas

MediGrid uses structured Mongoose models backed by index optimization:

- **User (`models/User.js`)**: Account credentials, email, password hash, OAuth providers (Google, GitHub, Microsoft), premium tier flag, profile avatar URL, and `onboardingCompleted` status boolean.
- **HealthProfile (`models/HealthProfile.js`)**: Comprehensive medical record including date of birth, biological sex, blood group, height, weight, allergies, chronic conditions, current medications, emergency contact details, and dietary preferences.
- **VitalsLog (`models/VitalsLog.js`)**: Telemetry time series capturing systolic/diastolic BP, pulse rate, glucose, SpO2, BMI, and clinical assessment notes.
- **Analysis (`models/Analysis.js`)**: Medical report parsing history containing document metadata, extracted biomarker parameters, clinical summaries, and risk ratings.
- **HealthPlan (`models/HealthPlan.js`)**: AI-generated 7-day care plans including dietary schedules, hydration milestones, and exercise regimens.
- **EmergencyLog (`models/EmergencyLog.js`)**: Audit trail of SOS activations, capturing coordinates, detected triage urgency, first-aid instructions provided, and notification delivery state.
- **Order (`models/Order.js`)**: Pharmacy transaction records containing line items, total billing amount, Razorpay order/payment identifiers, and fulfillment statuses.
- **Task (`models/Task.js`)**: User-managed daily wellness tasks and medication reminder items with completion tracking.
- **OtpVerification (`models/OtpVerification.js`)**: Temporary, index-expired OTP tokens for password recovery verification.
- **ChatSession (`models/ChatSession.js`)**: Conversation history for the AI Clinical Copilot.

---

## API Reference

All requests requiring authentication must supply a valid JWT in the HTTP Authorization header: `Authorization: Bearer <TOKEN>`.

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Create a new user account with email and password.
- `POST /api/auth/login` - Authenticate credentials and receive a 7-day JWT.
- `POST /api/auth/forgot-password` - Request a 6-digit verification code via email.
- `POST /api/auth/verify-otp` - Validate submitted password reset OTP.
- `POST /api/auth/reset-password` - Update account password using validated OTP.
- `POST /api/auth/google` - Authenticate via Google OAuth credential token.
- `POST /api/auth/github` - Authenticate via GitHub OAuth authorization code.
- `POST /api/auth/microsoft` - Authenticate via Microsoft Azure AD authorization code.

### Health Profile and Onboarding (`/api/health-profile`)
- `GET /api/health-profile/status` - Retrieve onboarding completion status and profile record.
- `POST /api/health-profile/onboarding` - Submit initial onboarding health data and unlock guarded routes.
- `GET /api/health-profile/me` - Retrieve current user's complete clinical health profile.
- `PUT /api/health-profile/me` - Update clinical attributes, allergies, or emergency contacts.

### Medical Reports and OCR (`/api/reports`)
- `POST /api/reports/analyze` - Upload report (multipart/form-data, max 20 MB) for OCR and AI analysis.
- `GET /api/reports/history` - Retrieve previously analyzed reports and biomarker logs.
- `GET /api/reports/:id` - Retrieve full diagnostic details for a specific report analysis.
- `DELETE /api/reports/:id` - Remove a stored report record from the user profile.

### Health Analytics and Vitals (`/api/health-analytics`)
- `GET /api/health-analytics/vitals` - Retrieve historical vitals time-series data.
- `POST /api/health-analytics/vitals` - Log a new vitals entry (BP, pulse, glucose, SpO2).
- `GET /api/health-analytics/summary` - Retrieve statistical risk indicators and health scoring.

### Emergency SOS and Triage (`/api/emergency`)
- `POST /api/emergency/sos` - Trigger emergency alert, log coordinates, and dispatch email alerts.
- `POST /api/emergency/assess-symptoms` - Submit emergency symptoms for immediate AI triage assessment.
- `GET /api/emergency/logs` - Retrieve audit history of emergency triggers.

### AI Health Planner (`/api/health-planner`)
- `GET /api/health-planner/current` - Retrieve active personalized diet, workout, and hydration plan.
- `POST /api/health-planner/generate` - Generate a new care plan based on recent health telemetry.
- `PUT /api/health-planner/task/:id` - Update completion status of a daily regimen task.

### Pharmacy and Orders (`/api/orders`, `/api/create-order`)
- `POST /api/create-order` - Generate a new Razorpay checkout order ID.
- `POST /api/orders` - Record confirmed medication order and update payment status.
- `GET /api/orders/user` - Retrieve order history for the authenticated user.

### Clinical AI Assistant (`/api/assistant`)
- `POST /api/assistant/chat` - Query the clinical conversational assistant.
- `GET /api/assistant/history` - Retrieve session chat history.

---

## Environment Configuration

Both the frontend and backend applications require environment variable configuration prior to execution.

### Backend Configuration (`backend/.env`)

| Variable | Requirement | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port on which the Express server listens |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development` or `production`) |
| `MONGODB_URI` | **Required** | None | MongoDB Atlas connection string |
| `JWT_SECRET` | **Required** | None | 64+ character random secret used for JWT signing |
| `GEMINI_API_KEY` | **Required** | None | Google AI Studio Gemini API key |
| `CORS_ORIGIN` | Optional | `http://localhost:5173` | Comma-delimited list of allowed origin URLs |
| `RAZORPAY_KEY_ID` | Optional | `mock` | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | Optional | `mock` | Razorpay private secret key |
| `GOOGLE_CLIENT_ID` | Optional | None | Google OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET`| Optional | None | Google OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | Optional | None | GitHub OAuth Application Client ID |
| `GITHUB_CLIENT_SECRET`| Optional | None | GitHub OAuth Application Client Secret |
| `MICROSOFT_CLIENT_ID` | Optional | None | Microsoft Azure AD Application Client ID |
| `MICROSOFT_CLIENT_SECRET`| Optional | None | Microsoft Azure AD Client Secret |
| `MICROSOFT_TENANT_ID` | Optional | `common` | Microsoft Azure AD Tenant ID |
| `EMAIL_USER` | Optional | None | Gmail address for transactional SMTP delivery |
| `EMAIL_PASS` | Optional | None | 16-character Gmail App Password |
| `CLOUDINARY_CLOUD_NAME`| Optional | None | Cloudinary cloud account name |
| `CLOUDINARY_API_KEY` | Optional | None | Cloudinary API access key |
| `CLOUDINARY_API_SECRET`| Optional | None | Cloudinary API secret |

### Frontend Configuration (`frontend/.env`)

All client-facing variables must be prefixed with `VITE_` to be included in the bundle.

| Variable | Requirement | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_BACKEND_URL` | **Required** | `http://localhost:5000`| Base URL of the running backend API |
| `VITE_GEMINI_API_KEY` | Optional | None | Direct client Gemini key for interactive copilot |
| `VITE_RAZORPAY_KEY_ID` | Optional | None | Public Razorpay key ID for client checkout |
| `VITE_GOOGLE_CLIENT_ID`| Optional | None | Public Google OAuth Client ID |
| `VITE_GITHUB_CLIENT_ID`| Optional | None | Public GitHub OAuth Client ID |
| `VITE_MICROSOFT_CLIENT_ID`| Optional | None | Public Microsoft Azure Client ID |

---

## Installation and Setup

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)
- Active MongoDB Atlas cluster or running local MongoDB daemon
- Valid Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/itzgauravgoswami/MediGrid.git
cd MediGrid
```

### 2. Configure Environment Files
Create environment files from their respective templates:

```bash
# Backend setup
cd backend
cp .env.example .env

# Frontend setup
cd ../frontend
cp .env.example .env
```
Populate `.env` files with your respective database credentials, API keys, and secrets.

### 3. Install Dependencies

**Backend Dependencies:**
```bash
cd ../backend
npm install
```

**Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

### 4. Running the Development Services

**Start the Backend API Server:**
```bash
cd backend
npm run dev
# The API gateway runs at http://localhost:5000
```

**Start the Frontend Development Server (in a second terminal):**
```bash
cd frontend
npm run dev
# The client interface runs at http://localhost:5173
```

---

## Deployment Configuration

MediGrid is architected to deploy to serverless infrastructure platforms such as Vercel.

### Backend Deployment (`backend/vercel.json`)
The backend is structured to execute as a Vercel Serverless Function targeting `@vercel/node`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "script.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "script.js"
    }
  ]
}
```

### Frontend Deployment (`frontend/vercel.json`)
The frontend leverages Single Page Application URL rewrite rules and `Cross-Origin-Opener-Policy` headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "unsafe-none"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Repository Structure

```
MediGrid/
├── .gitignore                      # Monorepo git exclusion specifications
├── CONTRIBUTING.md                 # Technical contribution guidelines
├── CODE_OF_CONDUCT.md              # Contributor covenant standards
├── LICENSE                         # MIT open source license
├── README.md                       # Master system documentation
├── SECURITY.md                     # Vulnerability reporting and security policy
│
├── backend/                        # Express API Gateway & Business Logic
│   ├── config/
│   │   └── env.js                  # Centralized startup env validation
│   ├── models/                     # Mongoose clinical data schemas
│   │   ├── Analysis.js             # Lab report analysis records
│   │   ├── ChatSession.js          # Conversational assistant logs
│   │   ├── EmergencyLog.js         # SOS emergency trigger events
│   │   ├── HealthPlan.js           # AI care plans and dietary tasks
│   │   ├── HealthProfile.js        # Clinical user health profile
│   │   ├── Order.js                # Pharmacy orders and payments
│   │   ├── OtpVerification.js      # Password recovery OTP tokens
│   │   ├── Task.js                 # Daily habit and medication tasks
│   │   ├── User.js                 # User credentials and OAuth records
│   │   └── VitalsLog.js            # Time-series physiological telemetry
│   ├── routes/                     # Express REST route controllers
│   │   ├── assistant.js            # AI clinical copilot
│   │   ├── auth.js                 # Credentials and OAuth providers
│   │   ├── emergency.js            # SOS dispatch and triage assessment
│   │   ├── healthAnalytics.js      # Vitals logging and risk scoring
│   │   ├── healthPlanner.js        # Regimen generation and tracking
│   │   ├── healthProfile.js        # Onboarding and profile updates
│   │   ├── orders.js               # Pharmacy checkout fulfillment
│   │   ├── reports.js              # In-memory OCR and report analysis
│   │   ├── tasks.js                # Task checklist management
│   │   └── user.js                 # User profile and account deletion
│   ├── utils/                      # Helper libraries
│   │   ├── email.js                # Nodemailer SMTP email dispatcher
│   │   ├── healthCalculations.js   # Clinical formula calculators
│   │   └── plannerHelper.js        # AI health regimen generator
│   ├── script.js                   # Primary Express application entry point
│   ├── vercel.json                 # Serverless deployment configuration
│   └── package.json                # Backend dependency manifest
│
└── frontend/                       # React 19 Client Application
    ├── public/                     # Static brand assets and icons
    ├── src/
    │   ├── components/             # Reusable UI and functional views
    │   │   ├── AIHealthPlanner.jsx       # Regimen generator view
    │   │   ├── Dashboard.jsx             # Master clinical dashboard tab shell
    │   │   ├── EmergencySOS.jsx          # SOS beacon and contact alerting
    │   │   ├── HealthAnalytics.jsx       # Vitals charts and risk indicators
    │   │   ├── HealthProfileSettings.jsx # Profile and clinical preferences
    │   │   ├── MedicalReportAnalyzer.jsx # Document OCR & analysis interface
    │   │   ├── Navbar.jsx                # Global navigation bar
    │   │   └── NearbyHospitals.jsx       # Leaflet geospatial hospital map
    │   ├── config/
    │   │   └── api.js              # Centralized backend URL client config
    │   ├── pages/                  # Top-level route pages
    │   │   ├── CreatePassword.jsx  # OAuth credential creation
    │   │   ├── Dashboard.jsx       # Dashboard route wrapper
    │   │   ├── ForgotPassword.jsx  # OTP password reset workflow
    │   │   ├── Home.jsx            # Landing page and clinical feature grid
    │   │   ├── NotFound.jsx        # 404 error boundary
    │   │   ├── Onboarding.jsx      # Multi-step medical questionnaire
    │   │   ├── SignIn.jsx          # User authentication page
    │   │   └── SignUp.jsx          # User registration page
    │   ├── App.jsx                 # Routing configuration and theme provider
    │   ├── App.css                 # Custom animation and grid styling
    │   ├── index.css               # Tailwind CSS v4 styling rules
    │   └── main.jsx                # Application root mounting entry point
    ├── vercel.json                 # Client SPA rewrite rules
    ├── vite.config.js              # Vite bundler configuration
    └── package.json                # Frontend dependency manifest
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development workflow, and pull request submission process.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Developed and maintained by **Gaurav Goswami**.
