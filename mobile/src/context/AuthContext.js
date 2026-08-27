import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/resources.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start, check for a stored token and restore the session —
  // this is why the app doesn't ask you to log in every time you open it.
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        try {
          setUser(await authApi.me());
        } catch {
          await SecureStore.deleteItemAsync('authToken');
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const { user, token } = await authApi.login({ email, password });
    await SecureStore.setItemAsync('authToken', token);
    setUser(user);
  }

  async function register(data) {
    const { user, token } = await authApi.register(data);
    await SecureStore.setItemAsync('authToken', token);
    setUser(user);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
