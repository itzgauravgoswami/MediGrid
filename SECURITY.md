# Security Policy

MediGrid is committed to ensuring the confidentiality, integrity, and availability of clinical health information and application services. This document outlines our vulnerability disclosure process, supported software versions, and security architecture principles.

---

## Supported Versions

Security updates and critical patches are actively applied to the following project releases:

| Version | Supported          | Status             |
| :------ | :----------------- | :----------------- |
| 1.0.x   | Yes                | Current Active     |
| < 1.0   | No                 | Deprecated         |

---

## Reporting a Vulnerability

If you discover a security vulnerability, we appreciate your cooperation in disclosing it to us responsibly. **Do not create public GitHub issues or discussions regarding security vulnerabilities.**

### Disclosure Protocol

1. Send an encrypted email or private security advisory to the maintainers at `itzgauravgoswami@gmail.com` with the subject line `[SECURITY] MediGrid Vulnerability Report`.
2. Include the following details in your communication:
   - Type of vulnerability (e.g., authentication bypass, injection, rate-limit evasion, cross-site scripting).
   - Step-by-step reproduction instructions or a minimal proof of concept.
   - Affected endpoints, modules, or client components.
   - Potential impact on clinical data or infrastructure integrity.
   - Recommended remediation or mitigation steps, if known.

### Response Timeline

- **Initial Acknowledgment**: Within 48 hours of report submission.
- **Triage and Assessment**: Within 5 business days.
- **Patch Resolution and Release**: Dependent on vulnerability severity, targeted within 14 business days.
- **Public Disclosure**: Coordinated after the fix has been deployed to production environments.

---

## Security Architecture Overview

MediGrid implements multiple defensive layers across its technology stack:

### 1. Transport and Header Hardening
- HTTP Strict Transport Security (HSTS), Content Security Policy (CSP), and Cross-Origin Resource Sharing (CORS) enforcement via Helmet.
- Explicit Permissions-Policy headers restricting camera, microphone, and non-origin geolocation execution.
- Domain whitelisting for all cross-origin requests.

### 2. Authentication and Access Control
- Passwords salted and hashed using `bcryptjs` with 12 rounds.
- Cryptographically signed JSON Web Tokens (JWT) using HMAC SHA-256 with minimum 64-character secret enforcement.
- Mandatory onboarding route guards preventing unauthorized access to medical records before clinical profile completion.
- Time-limited (10-minute expiry) single-use OTP verification for password resets.

### 3. API Protection and Rate Limiting
- Multi-tier IP rate limiters applied at the Express router level:
  - General API Gateway: 2,000 requests per 15-minute window.
  - Report Analysis and OCR: 300 requests per 15-minute window.
  - Health Planner Generation: 500 requests per 15-minute window.
  - Health Analytics Ingestion: 600 requests per 15-minute window.
  - Emergency SOS Trigger: 600 requests per 15-minute window.

### 4. Input Sanitization and Prompt Injection Defense
- Strict input parsing and character stripping (removing HTML tags, script vectors, and non-printable control characters) across all data intake endpoints.
- Structured LLM system prompts equipped with adversarial injection isolation barriers, enforcing pure clinical data ingestion and refusing system prompt overrides.

### 5. Data Privacy and HIPAA Alignment
- No permanent storage of medical documents on local disks during analysis; Multer operates entirely in in-memory buffers.
- Separation of concerns between user identity records and analytical medical logs.
