import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '../src/utils/stripe';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          {/* 2. Wrap the navigation stack and inject your secure public key */}
          <StripeProvider 
            publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}
            merchantIdentifier="merchant.com.techstore" // Used for Apple Pay later
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen 
                name="product/[id]" 
                options={{ 
                  presentation: 'transparentModal', 
                  animation: 'fade',
                  contentStyle: { backgroundColor: 'transparent' } 
                }} 
              />
            </Stack>
          </StripeProvider>
        </CartProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}