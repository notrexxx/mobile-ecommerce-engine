import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 🚀 THE FIX: Use the Vercel Environment Variable first!
  // If it's missing, you can hardcode your Render URL as the fallback inside the quotes below.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL; 
  }
  
  // Fallbacks for local development
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptor: Before ANY request leaves the phone, this function runs.
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Fetch the secure JWT token from the phone's local storage
    const token = await AsyncStorage.getItem('@ecommerce_jwt');
    
    // 2. If it exists, inject it into the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);