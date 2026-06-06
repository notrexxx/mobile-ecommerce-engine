import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';

export default function CheckoutScreen({ navigation }: any) {
  const { cart, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#000000' : '#F2F2F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#EBEBF599' : '#3C3C4399',
    border: isDark ? '#38383A' : '#C6C6C8',
    primary: '#0A84FF',
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

    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsProcessing(true);

    try {
      const userStr = await AsyncStorage.getItem('user_profile');
      if (!userStr) throw new Error('User authentication missing.');
      
      const user = JSON.parse(userStr);
      
      const cartItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      await api.post('/orders/checkout', {
        userId: user.id,
        cartItems,
      });

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
      
      const errorMessage = error.response?.data?.message || 'Transaction failed. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Checkout Error',
        text2: errorMessage,
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Shipping Address</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Street Address"
              placeholderTextColor={theme.subtext}
              value={address}
              onChangeText={setAddress}
              editable={!isProcessing}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="City"
              placeholderTextColor={theme.subtext}
              value={city}
              onChangeText={setCity}
              editable={!isProcessing}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Zip Code"
              placeholderTextColor={theme.subtext}
              keyboardType="number-pad"
              value={zipCode}
              onChangeText={setZipCode}
              editable={!isProcessing}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Summary</Text>
          <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: theme.subtext }]}>Subtotal</Text>
              <Text style={[styles.summaryText, { color: theme.text }]}>${getCartTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: theme.subtext }]}>Shipping</Text>
              <Text style={[styles.summaryText, { color: theme.text }]}>Free</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 12 }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotal, { color: theme.text }]}>Total</Text>
              <Text style={[styles.summaryTotal, { color: theme.text }]}>${getCartTotal().toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.payButton, { backgroundColor: theme.primary, opacity: isProcessing ? 0.7 : 1 }]}
          activeOpacity={0.8}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Confirm & Pay</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  inputContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  input: { height: 50, paddingHorizontal: 16, fontSize: 17 },
  divider: { height: 1, width: '100%' },
  summaryBox: { borderRadius: 12, borderWidth: 1, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 16 },
  summaryTotal: { fontSize: 18, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1 },
  payButton: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  payButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});