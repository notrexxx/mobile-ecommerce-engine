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
          {/* THE FIX: We use a Stack to control exactly how screens transition */}
          <Stack screenOptions={{ headerShown: false }}>
            
            {/* The Product screen is explicitly forced to be a transparent overlay */}
            <Stack.Screen 
              name="product/[id]" 
              options={{ 
                presentation: 'transparentModal', 
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' } 
              }} 
            />

          </Stack>
        </CartProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}