import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your machine's LAN IP when testing on a physical phone —
// 'localhost' on the phone refers to the phone itself, not your dev machine.
export const API_BASE_URL = 'http://192.168.0.16:3000';

export const api = axios.create({ baseURL: API_BASE_URL });

// Attach the stored JWT to every outgoing request automatically, so
// individual screens never have to think about auth headers.
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
