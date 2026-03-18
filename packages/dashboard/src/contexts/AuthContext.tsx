import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../config/api';

interface User {
  id: string;
  email: string;
  role: string;
  organization: { id: string; name: string; slug: string } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ota_token');
    if (savedToken) {
      setToken(savedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      // Verify token by fetching user
      api
        .get('/api/v1/auth/me')
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setUser(res.data.data);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('ota_token');
            setToken(null);
            delete api.defaults.headers.common['Authorization'];
          }
        })
        .catch(() => {
          localStorage.removeItem('ota_token');
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      if (res.data?.success && res.data.data) {
        const { token: newToken, user: userData } = res.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('ota_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ota_token');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
