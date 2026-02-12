import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AdminCredentials } from '@/types/market';

// Admin password - in production, use Firebase Auth
const ADMIN_PASSWORD = 'fakepixel2024';

const AdminContext = createContext<AdminCredentials | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check session storage for existing auth
    return sessionStorage.getItem('admin_auth') === 'true';
  });

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  }, []);

  const value: AdminCredentials = {
    isAuthenticated,
    login,
    logout,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export default AdminContext;
