import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

const ROL_ADMIN = 'administrador';
const MSG_SOLO_ADMIN = 'Este portal es exclusivo para administradores.';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      // Defensa adicional: cubre un token viejo de un usuario no-admin que
      // haya quedado en localStorage de antes de exigir el scope en el login.
      if (userData.rol?.nombre !== ROL_ADMIN) {
        localStorage.removeItem('token');
        setUser(null);
        setError(MSG_SOLO_ADMIN);
        return;
      }
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error("Error al validar sesión:", err);
      localStorage.removeItem('token');
      setUser(null);
      setError("Sesión expirada");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (correo, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(correo, password);
      localStorage.setItem('token', data.access_token);
      const userData = await api.getMe();
      if (userData.rol?.nombre !== ROL_ADMIN) {
        localStorage.removeItem('token');
        setUser(null);
        setError(MSG_SOLO_ADMIN);
        throw new Error(MSG_SOLO_ADMIN);
      }
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser: checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
