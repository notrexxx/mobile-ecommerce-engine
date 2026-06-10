import React, { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';

import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import AdminOrdersScreen from './src/screens/AdminOrdersScreen';
import AdminOrderDetailsScreen from './src/screens/AdminOrderDetailsScreen';
import AdminProductsScreen from './src/screens/AdminProductsScreen';
import AdminProductFormScreen from './src/screens/AdminProductFormScreen'; 

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'https://mobile-ecommerce-engine-nygp.vercel.app'],
  config: {
    initialRouteName: 'Home' as const,
    screens: {
      Home: '', 
      Login: 'login', 
      Register: 'register',
      ProductDetails: 'product',
      Cart: 'cart',
      Checkout: 'checkout',
      AdminOrders: 'admin/orders', 
      AdminOrderDetails: 'admin/order-details',
      AdminProducts: 'admin/products',
      AdminProductForm: 'admin/product-form',
    },
  },
};

export default function App() {
  const scheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer 
            linking={linking} 
            theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ headerShown: false }} />
              <Stack.Screen name="AdminOrderDetails" component={AdminOrderDetailsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="AdminProducts" component={AdminProductsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} options={{ headerShown: false, presentation: 'modal' }} />
              
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false, presentation: 'transparentModal' }} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </CartProvider>
      </AuthProvider>
    </View>
  );
}