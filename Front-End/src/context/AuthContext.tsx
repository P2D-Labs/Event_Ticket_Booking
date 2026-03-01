import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isPremium: boolean;
  avatarUrl?: string;
  organization?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
  /** Step 1: submit registration – sends OTP to email; returns email on success */
  register: (data: { email: string; password: string; name: string; phone: string; organization?: string }) => Promise<{ email: string }>;
  /** Step 2: verify OTP and complete registration – logs in and returns user */
  registerVerifyOtp: (email: string, otp: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/api/auth/me');
      if (data.user) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: {
    email: string;
    password: string;
    name: string;
    phone: string;
    organization?: string;
  }) => {
    const { data } = await api.post('/api/auth/register', payload);
    return { email: data.email };
  };

  const registerVerifyOtp = async (email: string, otp: string) => {
    const { data } = await api.post('/api/auth/register/verify-otp', { email, otp });
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerVerifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
