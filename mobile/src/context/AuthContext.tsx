import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

// 🚀 Bring in the Expo Push Notification engine
import { registerForPushNotificationsAsync } from '../utils/notifications';

// Define the exact shape of the User object returned by our NestJS backend
interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // App Bootup Sequence: Check if the user closed the app without logging out
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@ecommerce_jwt');
        const storedUser = await AsyncStorage.getItem('@ecommerce_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false); // Tell the app we are done checking, remove the splash screen
      }
    };

    loadSession();
  }, []);

  // Centralized function to handle push token generation and saving
  const handlePushTokenRegistration = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        console.log("🔥 EXPO PUSH TOKEN GRABBED:", pushToken);
        
        // 🚀 We will uncomment this in the next step when we build the NestJS endpoint!
        // await apiClient.patch('/users/push-token', { pushToken });
      }
    } catch (error) {
      console.log("Could not register for push notifications", error);
    }
  };

  const login = async (email: string, password: string) => {
    // Send the request to our backend
    const response = await apiClient.post('/auth/login', { email, password });
    
    const { user: backendUser, token: backendToken } = response.data;

    // Save to State
    setUser(backendUser);
    setToken(backendToken);

    // Save to Device Storage (Persistence)
    await AsyncStorage.setItem('@ecommerce_jwt', backendToken);
    await AsyncStorage.setItem('@ecommerce_user', JSON.stringify(backendUser));

    // 🚀 Fire the notification registration seamlessly in the background
    await handlePushTokenRegistration();
  };

  const register = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, password });
    
    const { user: backendUser, token: backendToken } = response.data;

    setUser(backendUser);
    setToken(backendToken);

    await AsyncStorage.setItem('@ecommerce_jwt', backendToken);
    await AsyncStorage.setItem('@ecommerce_user', JSON.stringify(backendUser));

    // 🚀 Instantly capture new users for marketing/shipping notifications
    await handlePushTokenRegistration();
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    
    // Optional: We can tell the backend to clear the push token here so they 
    // don't get notifications while logged out, but we'll tackle that later!
    
    // Securely wipe the keys from the phone
    await AsyncStorage.removeItem('@ecommerce_jwt');
    await AsyncStorage.removeItem('@ecommerce_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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