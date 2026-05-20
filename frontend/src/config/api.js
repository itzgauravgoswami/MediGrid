/**
 * frontend/src/config/api.js
 *
 * Single source of truth for the backend API base URL.
 * Every component that makes a fetch() to the backend must
 * import BACKEND_URL from this file — no hardcoded localhost strings.
 *
 * In development:  set VITE_BACKEND_URL=http://localhost:5000 in frontend/.env
 * In production:   set VITE_BACKEND_URL=https://your-api-domain.com in your CI/CD env
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
