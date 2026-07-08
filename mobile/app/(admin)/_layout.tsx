import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform, View } from 'react-native';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { user } = useAuth();
  const router = useRouter();
  
  // 🚀 THE LOGOUT FIX: Cleanly eject unauthorized users to the Storefront
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        setTimeout(() => router.replace('/'), 10);
      }
    }
  }, [user]);

  // If logged out, render an empty view to instantly kill the CMS UI and prevent loops
  if (!user || user.role !== 'admin') {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
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
      {/* 🚀 THE COLLISION FIX: This now points to your newly renamed dashboard.tsx file! */}
      <Tabs.Screen
        name="dashboard" 
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
      <Tabs.Screen
        name="product-form"
        options={{
          title: 'New Product',
          href: '/(admin)/product-form?id=', 
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="order-details" options={{ href: null }} />
    </Tabs>
  );
}