import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, getCurrentUser, restoreSession, logoutRequest } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await restoreSession();
        if (stored) {
          const me = await getCurrentUser();
          setUsuario(me);
          setToken(stored);
        }
      } catch {
        // Token inválido o API no disponible: limpiar sesión.
        await logoutRequest();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (correo, password) => {
    const newToken = await loginRequest(correo, password);
    const me = await getCurrentUser();
    setToken(newToken);
    setUsuario(me);
    return me;
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setToken(null);
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({ usuario, token, loading, signIn, signOut }),
    [usuario, token, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}