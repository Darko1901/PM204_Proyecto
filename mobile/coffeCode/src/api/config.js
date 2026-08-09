import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;

function resolveHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    // Emulador Android: 10.0.2.2 apunta al localhost de la máquina host.
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }

  return host;
}

// En Expo Go / dev build, hostUri es "IP:8081" del metro; usamos la misma IP
// con el puerto del API. Sobrescribible con EXPO_PUBLIC_API_URL.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${resolveHost()}:${API_PORT}`;
