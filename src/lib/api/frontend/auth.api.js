import { buildUrl, fetchJson } from './client.js';

export const signup = async ({ email, password, username, firstname, lastname, department, contactNumber }) => {
  return fetchJson(buildUrl('/signup'), {
    method: 'POST',
    body: JSON.stringify({ email, password, username, firstname, lastname, department, contactNumber })
  });
};

export const verifyOtp = async ({ email, code }) => {
  return fetchJson(buildUrl('/verify-otp'), {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
};

export const resendOtp = async ({ email }) => {
  return fetchJson(buildUrl('/resend-otp'), {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const forgotPassword = async ({ email }) => {
  return fetchJson(buildUrl('/forgot-password'), {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const verifyForgotPasswordOtp = async ({ email, code }) => {
  return fetchJson(buildUrl('/verify-forgot-password-otp'), {
    method: 'POST',
    body: JSON.stringify({ email, code })
  });
};

export const updatePassword = async ({ email, code, newPassword }) => {
  return fetchJson(buildUrl('/update-password'), {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword })
  });
};
