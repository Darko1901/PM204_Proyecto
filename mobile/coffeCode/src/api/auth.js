import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from './client';

export const TOKEN_KEY = 'cc_auth_token';

export async function loginRequest(correo, password) {
  const { access_token } = await api.login(correo, password);
  await SecureStore.setItemAsync(TOKEN_KEY, access_token);
  setAuthToken(access_token);
  return access_token;
}

export async function getCurrentUser() {
  return api.get('/auth/me');
}

// Restaura la sesión guardada si existe (inicio de la app).
export async function restoreSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    setAuthToken(token);
    return token;
  }
  return null;
}

export async function logoutRequest() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  setAuthToken(null);
}