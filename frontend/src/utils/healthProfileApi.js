/**
 * healthProfileApi.js
 * Centralized API layer for all HealthProfile operations.
 * All functions require a valid JWT Bearer token.
 */

import { BACKEND_URL } from '../config/api';

const BACKEND = BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * Check if the current user has a completed health profile.
 * @returns {{ hasProfile: boolean, onboardingCompleted: boolean, onboardingStep: number }}
 */
export async function getHealthProfileStatus() {
  const res = await fetch(`${BACKEND}/api/health-profile/status`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to check health profile status.');
  }
  return res.json();
}

/**
 * Fetch the full health profile for the authenticated user.
 * @returns {{ success: boolean, profile: object }}
 */
export async function getHealthProfile() {
  const res = await fetch(`${BACKEND}/api/health-profile`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch health profile.');
  }
  return res.json();
}

/**
 * Create the initial health profile (called at end of onboarding).
 * @param {object} profileData - Full profile data from all 6 steps
 * @returns {{ success: boolean, profile: object, computedMetrics: object }}
 */
export async function createHealthProfile(profileData) {
  const res = await fetch(`${BACKEND}/api/health-profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create health profile.');
  return data;
}

/**
 * Partially update the health profile. Only sends changed fields.
 * Backend will recalculate derived metrics (BMI, water goal, calories).
 * @param {object} updates - Partial profile fields to update
 * @returns {{ success: boolean, profile: object, computedMetrics: object }}
 */
export async function updateHealthProfile(updates) {
  const res = await fetch(`${BACKEND}/api/health-profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update health profile.');
  return data;
}
