import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authAPI, usersAPI } from '../services/api';

export type UserRole = 'professor' | 'department_head';

export interface User {
  id: string;
  idNumber: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  academicArea?: string;
  isAdministrator?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  refreshSession: () => Promise<User | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJWT = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const mapBackendRoleToFrontend = (backendRole: string | undefined | null): UserRole => {
  if (!backendRole || typeof backendRole !== 'string') {
    return 'professor';
  }

  const roleUpper = backendRole.toUpperCase().trim();

  if (roleUpper === 'DOCENTE' || roleUpper === 'PROFESSOR' || roleUpper === 'PROFESOR') {
    return 'professor';
  }

  if (
    roleUpper === 'JEFE_DEPARTAMENTO' ||
    roleUpper === 'JEFE DEPARTAMENTO' ||
    roleUpper === 'DEPARTMENT_HEAD' ||
    roleUpper === 'ADMIN' ||
    roleUpper === 'ADMINISTRADOR' ||
    roleUpper === 'DIRECTOR'
  ) {
    return 'department_head';
  }

  return 'department_head';
};

function userFromToken(decoded: Record<string, unknown>): User {
  const roles = decoded.roles as string[] | undefined;
  const tokenRole = roles?.[0] || (decoded.role as string) || 'DOCENTE';
  return {
    id: String(decoded.userId ?? decoded.email ?? ''),
    idNumber: String(decoded.email ?? ''),
    name: String(decoded.name ?? decoded.email ?? ''),
    email: String(decoded.email ?? ''),
    role: mapBackendRoleToFrontend(tokenRole),
    department: String(decoded.departmentName ?? ''),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const profile = await usersAPI.getMe();
      setUser(profile);
      return profile;
    } catch {
      const decoded = decodeJWT(token);
      if (decoded?.email) {
        const fallback = userFromToken(decoded);
        setUser(fallback);
        return fallback;
      }
      localStorage.removeItem('authToken');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await authAPI.login({ email, password });
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateProfile, refreshSession, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
