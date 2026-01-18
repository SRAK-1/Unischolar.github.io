import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthState } from '../types';
import { Api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Load from local storage on mount to persist session
  useEffect(() => {
    const savedUser = localStorage.getItem('unischolar_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('unischolar_user');
      }
    }
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const userData = await Api.login(email, pass);
    setUser(userData);
    localStorage.setItem('unischolar_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('unischolar_user');
    navigate('/'); // Redirect to landing page
  };
  
  const refreshProfile = async () => {
      // In a real app we fetch updated data. Here we re-sync context with local state changes if any.
      if (user) {
         // Update the localStorage copy if we modify the user object elsewhere in the app (like Profile)
         // Note: Api.updateProfile returns the updated object, typically the component calls setUser.
         // We'll trust the component to call setUser, but here we update localStorage
         localStorage.setItem('unischolar_user', JSON.stringify(user));
      }
  };

  const setSession = (userData: User) => {
    setUser(userData);
    localStorage.setItem('unischolar_user', JSON.stringify(userData));
  };

  // Intercept state changes to persist them (e.g. when Profile page calls setUser indirectly via a wrapper or context update)
  // Since we expose `user` directly, components might update backend but context needs to know.
  // The Profile page calls API then refreshProfile.
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshProfile, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};