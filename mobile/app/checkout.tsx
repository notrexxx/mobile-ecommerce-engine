import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, useColorScheme, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

import { useStripe } from '../src/utils/stripe';
import { supabase } from '../src/utils/supabase'; 
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { lightTheme, darkTheme } from '../src/theme/theme';
import StyledText from '../src/components/StyledText';
import PremiumInput from '../src/components/PremiumInput';
import PremiumButton from '../src/components/PremiumButton';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, logout } = useAuth();
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handlePayment = async () => {
    if (!fullName || !address || !city || !zipCode) return Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please fill out all shipping details.' });
    if (cart.length === 0) return Toast.show({ type: 'info', text1: 'Empty Cart', text2: 'Please add items before checking out.' });
    if (!user || !user.id) {
      Toast.show({ type: 'error', text1: 'Authentication Required', text2: 'Please log in to complete your purchase.' });
      return router.push('/(auth)/login');
    }

    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    const cleanOrderItems = cart.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      quantity: item.quantity,
      imageUrl: item.product.imageUrl || item.product.image_url || ''
    }));

    const shippingDetails = { name: fullName, address, city, zipCode };
    const customerEmail = user.email || 'Unknown Email';

    const orderPayload = {
      userId: user.id, 
      customerEmail,
      shippingDetails,
      stripePaymentId: Platform.OS === 'web' ? 'web_hosted_session' : '', 
      items: cleanOrderItems, 
      totalAmount: Number(getCartTotal().toFixed(2)), 
      status: 'pending'
    };

    // 🚀 THE FIX: Reusable Inventory Helper
    const updateInventory = async () => {
      console.log("📦 Deducting stock from database...");
      const stockUpdates = cart.map(async (cartItem) => {
        const { data: currentProduct } = await supabase.from('products').select('stock').eq('id', cartItem.product.id).single();
        if (currentProduct) {
          const { error } = await supabase.from('products').update({ stock: Math.max(0, currentProduct.stock - cartItem.quantity) }).eq('id', cartItem.product.id);
          if (error) console.error(`❌ Failed to update stock for ${cartItem.product.name}:`, error);
        }
      });
      await Promise.all(stockUpdates);
    };

    try {
      if (Platform.OS === 'web') {
        const { error: webOrderError } = await supabase.from('orders').insert(orderPayload);
        if (webOrderError) throw new Error(`Supabase Error: ${webOrderError.message}`);

        // 🚀 THE FIX: Run inventory update before jumping to Stripe!
        await updateInventory();

        const originDomain = window.location.origin;
        const response = await fetch(`${backendUrl}/stripe/checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: getCartTotal(), originDomain }),
        });

        if (!response.ok) throw new Error('Failed to create web checkout session');
        const { url } = await response.json();

        clearCart();
        window.location.href = url;
        return; 
      }

      // MOBILE FLOW
      const response = await fetch(`${backendUrl}/stripe/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: getCartTotal() }),
      });

      if (!response.ok) throw new Error('Failed to connect to the payment server.');
      const { clientSecret } = await response.json();
      
      const stripePaymentId = clientSecret.split('_secret_')[0];
      orderPayload.stripePaymentId = stripePaymentId;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tech Store Premium',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { address: { line1: address, city: city, postalCode: zipCode } },
        appearance: { colors: { primary: theme.primary } }
      });

      if (initError) throw new Error(`Stripe Init Error: ${initError.message}`);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        setIsProcessing(false);
        return; 
      }

      const { error: orderError } = await supabase.from('orders').insert(orderPayload);
      if (orderError) throw new Error(`Supabase Error: ${orderError.message}`);

      // 🚀 THE FIX: Run inventory update for mobile
      await updateInventory();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Order Confirmed', text2: 'Your payment was successfully processed!' });

      clearCart();
      
      const receiptData = {
        items: cleanOrderItems,
        total: getCartTotal().toFixed(2),
        shipping: shippingDetails,
        email: customerEmail,
        stripeId: stripePaymentId,
        date: new Date().toLocaleString()
      };

      router.replace({ 
        pathname: '/success', 
        params: { receipt: JSON.stringify(receiptData) } 
      });

    } catch (error: any) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Transaction Error', text2: error.message || 'Something went wrong.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Image source={require('../assets/tech-logo.png')} style={[styles.headerLogo, { tintColor: theme.text }]} resizeMode="contain" />
          <View style={styles.iconButton} />
        </View>
      </BlurView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerWrapper}>
          <View style={styles.responsiveContent}>
            
            <View style={styles.section}>
              <StyledText variant="h2" style={styles.sectionTitle}>Shipping Address</StyledText>
              <View style={styles.formContainer}>
                <PremiumInput placeholder="Full Name" value={fullName} onChangeText={setFullName} editable={!isProcessing} />
                <PremiumInput placeholder="Street Address" value={address} onChangeText={setAddress} editable={!isProcessing} />
                <PremiumInput placeholder="City" value={city} onChangeText={setCity} editable={!isProcessing} />
                <PremiumInput placeholder="Zip Code" keyboardType="number-pad" value={zipCode} onChangeText={setZipCode} editable={!isProcessing} />
              </View>
            </View>

            <View style={styles.section}>
              <StyledText variant="h2" style={styles.sectionTitle}>Order Summary</StyledText>
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

      <BlurView intensity={85} tint={isDark ? 'dark' : 'light'} style={[styles.bottomBar, { borderTopColor: theme.border }]}>
        <View style={styles.centerWrapper}>
          <View style={styles.bottomBarContent}>
            <PremiumButton title="Confirm & Pay" onPress={handlePayment} isLoading={isProcessing} />
          </View>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo: { width: 150, height: 45 },
  iconButton: { width: 40, alignItems: 'flex-start' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 110 : 90, paddingBottom: Platform.OS === 'ios' ? 140 : 120 },
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