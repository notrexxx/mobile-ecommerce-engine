import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { user } = useAuth();

  // 🚀 Security: Kick out non-admins
  if (!user || user.role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: theme.surface, 
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
        }}
      />
      
      {/* 🚀 THE FIX: Hide internal screens from the bottom tab bar */}
      <Tabs.Screen name="[id]" options={{ href: null }} />
      <Tabs.Screen name="order-details" options={{ href: null }} />
      
      {/* This hides your specific form file from creating an ugly tab */}
      <Tabs.Screen name="product-form" options={{ href: null }} />
    </Tabs>
  );
}