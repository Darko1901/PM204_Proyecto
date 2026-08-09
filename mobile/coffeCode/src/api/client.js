import { API_URL } from './config';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      (typeof data?.detail === 'string' && data.detail) ||
      data?.message ||
      `Error ${response.status}`;
    throw new ApiError(detail, response.status, data);
  }

  return data;
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const finalHeaders = { ...headers };

  const token = getAuthToken();
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload = body;
  if (!isForm && body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: payload,
  });

  return parseResponse(response);
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),

  // El login usa OAuth2PasswordRequestForm (form-urlencoded)
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      isForm: true,
    }),
};