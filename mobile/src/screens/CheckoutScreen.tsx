import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, signOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been securely signed out.',
      });
      navigation.replace('Login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: error.message,
      });
    }
  };

  const handlePayment = async () => {
    if (!address || !city || !zipCode) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill out all shipping details.',
      });
      return;
    }

    if (cart.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Empty Cart',
        text2: 'Please add items before checking out.',
      });
      return;
    }

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to complete your purchase.',
      });
      navigation.navigate('Login');
      return;
    }

    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      // Step 1: Create the Order Record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: cart, 
          total: getCartTotal(),
          status: 'pending'
        });

      if (orderError) throw orderError;

    
      const stockUpdates = cart.map(async (cartItem) => {
        // Fetch current stock to calculate precise deduction
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock')
          .eq('id', cartItem.id)
          .single();

        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock - cartItem.quantity); // Ensures stock never drops below 0
          
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', cartItem.id);
        }
      });

      // Execute all stock deductions concurrently
      await Promise.all(stockUpdates);

      // Step 3: Finalize Checkout UX
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: 'success',
        text1: 'Order Confirmed',
        text2: 'Your secure transaction was successful!',
      });

      clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

    } catch (error: any) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Toast.show({
        type: 'error',
        text1: 'Checkout Error',
        text2: error.message || 'Transaction failed. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Image source={require('../../assets/tech-logo.png')} style={[styles.headerLogo, { tintColor: theme.text }]} resizeMode="contain" />
          
          {user ? (
            <TouchableOpacity onPress={handleLogout} style={styles.authButtonWrapper}>
              <Ionicons name="log-out-outline" size={24} color={theme.text} />
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text, display: Platform.OS === 'web' ? 'flex' : 'none' }]}>Log Out</StyledText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButtonWrapper}>
              <Ionicons name="person-outline" size={24} color={theme.text} />
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text, display: Platform.OS === 'web' ? 'flex' : 'none' }]}>Log In</StyledText>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.centerWrapper}>
          <View style={styles.responsiveContent}>
            
            <View style={styles.section}>
              <StyledText variant="h2" style={styles.sectionTitle}>
                Shipping Address
              </StyledText>
              <View style={styles.formContainer}>
                <PremiumInput placeholder="Street Address" value={address} onChangeText={setAddress} editable={!isProcessing} />
                <PremiumInput placeholder="City" value={city} onChangeText={setCity} editable={!isProcessing} />
                <PremiumInput placeholder="Zip Code" keyboardType="number-pad" value={zipCode} onChangeText={setZipCode} editable={!isProcessing} />
              </View>
            </View>

            <View style={styles.section}>
              <StyledText variant="h2" style={styles.sectionTitle}>
                Order Summary
              </StyledText>
              <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <StyledText variant="body" style={{ color: theme.subtext }}>Subtotal</StyledText>
                  <StyledText variant="body" style={{ fontWeight: '600' }}>${getCartTotal().toFixed(2)}</StyledText>
                </View>
                <View style={styles.summaryRow}>
                  <StyledText variant="body" style={{ color: theme.subtext }}>Shipping</StyledText>
                  <StyledText variant="body" style={{ fontWeight: '600' }}>Free</StyledText>
                </View>
                
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                
                <View style={styles.summaryRow}>
                  <StyledText variant="h3">Total</StyledText>
                  <StyledText variant="h3">${getCartTotal().toFixed(2)}</StyledText>
                </View>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      <BlurView 
        intensity={85} 
        tint={isDark ? 'dark' : 'light'} 
        style={[styles.bottomBar, { borderTopColor: theme.border }]}
      >
        <View style={styles.centerWrapper}>
          <View style={styles.bottomBarContent}>
            <PremiumButton 
              title="Confirm & Pay" 
              onPress={handlePayment} 
              isLoading={isProcessing}
            />
          </View>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { 
    position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth 
  },
  headerContent: { 
    paddingTop: Platform.OS === 'ios' ? 44 : 20, 
    paddingBottom: 8, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  headerLogo: { width: 150, height: 45 },
  iconButton: { width: 40, alignItems: 'flex-start' },
  authButtonWrapper: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  authButtonText: { fontWeight: '600', marginLeft: 6 },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 110 : 90, 
    paddingBottom: Platform.OS === 'ios' ? 140 : 120,
  },
  centerWrapper: { width: '100%', alignItems: 'center', paddingHorizontal: 24 },
  responsiveContent: { width: '100%', maxWidth: 600 },
  section: { marginBottom: 40 },
  sectionTitle: { marginBottom: 24 },
  formContainer: { width: '100%' },
  summaryBox: { borderRadius: 20, borderWidth: 1, padding: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  divider: { height: 1, width: '100%', marginVertical: 8, marginBottom: 20 },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', borderTopWidth: StyleSheet.hairlineWidth, zIndex: 20 },
  bottomBarContent: { width: '100%', maxWidth: 600, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 38 : 24 },
});