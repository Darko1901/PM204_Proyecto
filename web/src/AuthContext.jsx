import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

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

  const checkRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.rol.nombre);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkRole,
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
