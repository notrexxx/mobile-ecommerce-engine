import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useColorScheme, Platform, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { supabase } from '../src/utils/supabase';
import { useAuth } from '../src/context/AuthContext';
import { lightTheme, darkTheme } from '../src/theme/theme';
import StyledText from '../src/components/StyledText';
import PremiumButton from '../src/components/PremiumButton';

export default function SuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Try to catch the local params (Mobile Flow)
  const { receipt } = useLocalSearchParams();
  const initialReceipt = receipt ? JSON.parse(receipt as string) : null;

  // State to hold the final receipt data (whether from params or database)
  const [receiptData, setReceiptData] = useState<any>(initialReceipt);
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(!initialReceipt);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();

  // 🚀 THE FIX: The Detective Function
  useEffect(() => {
    // If we already have it from mobile, stop here.
    if (receiptData) {
      setIsFetchingReceipt(false);
      return;
    }

    // If we are on Web and Stripe wiped the params, fetch the latest order from Supabase
    const fetchLatestOrder = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          const parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
          const shipping = typeof data.shippingDetails === 'string' ? JSON.parse(data.shippingDetails) : (data.shippingDetails || {});

          setReceiptData({
            items: parsedItems,
            total: data.totalAmount,
            shipping: shipping,
            email: data.customerEmail,
            stripeId: data.stripePaymentId || 'web_hosted_session',
            date: new Date(data.createdAt || data.created_at).toLocaleString()
          });
        }
      } catch (err) {
        console.error("Failed to recover receipt from Supabase:", err);
      } finally {
        setIsFetchingReceipt(false);
      }
    };

    fetchLatestOrder();
  }, [user, receiptData]);


  const handlePrint = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!receiptData) {
      Toast.show({ type: 'error', text1: 'Receipt Unavailable', text2: 'Order data lost. Please check your admin dashboard.' });
      return;
    }

    const itemsHtml = receiptData.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
        <span style="font-size: 16px; color: #333;">${item.quantity}x ${item.name}</span>
        <span style="font-size: 16px; font-weight: 600; color: #111;">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto;">
          
          <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 24px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Tech Store</h1>
            <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Official Receipt / Proof of Purchase</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase;">Billed To</p>
              <p style="margin: 0; font-weight: 600; font-size: 16px;">${receiptData.shipping?.name || 'Customer'}</p>
              <p style="margin: 4px 0 0 0; color: #444; font-size: 14px;">${receiptData.email}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase;">Transaction Details</p>
              <p style="margin: 0; font-weight: 600; font-size: 14px;">Date: ${receiptData.date}</p>
              <p style="margin: 4px 0 0 0; color: #444; font-size: 14px;">TXN: ${receiptData.stripeId}</p>
            </div>
          </div>

          <h3 style="text-transform: uppercase; font-size: 14px; color: #666; margin-bottom: 16px;">Order Summary</h3>
          
          <div style="margin-bottom: 32px; border-top: 1px solid #eee;">
            ${itemsHtml}
          </div>

          <div style="display: flex; justify-content: space-between; padding: 20px; background: #111; color: #fff; border-radius: 8px;">
            <span style="font-size: 18px; font-weight: 600;">Total Paid</span>
            <span style="font-size: 18px; font-weight: 700;">$${receiptData.total}</span>
          </div>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase;">Shipping Destination</p>
            <p style="margin: 0; color: #333; font-size: 14px;">${receiptData.shipping?.address || 'N/A'}</p>
            <p style="margin: 4px 0 0 0; color: #333; font-size: 14px;">${receiptData.shipping?.city || ''}, ${receiptData.shipping?.zipCode || ''}</p>
          </div>

          <p style="text-align: center; margin-top: 60px; color: #888; font-size: 14px;">Thank you for your business. Please retain this receipt for your records.</p>
        </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 250);
      }
    } else {
      try {
        await Print.printAsync({ html: htmlContent });
      } catch (error) {
        console.error("Printing failed:", error);
      }
    }
  };

  const handleContinue = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.content, { maxWidth: width > 768 ? 600 : '100%' }]}>
        
        <View style={[styles.iconContainer, { backgroundColor: '#34C75920' }]}>
          <Ionicons name="checkmark-circle" size={100} color="#34C759" />
        </View>

        <StyledText variant="h1" style={styles.title}>Payment Successful!</StyledText>
        <StyledText variant="body" style={[styles.subtitle, { color: theme.subtext }]}>
          Your order has been securely processed and is being prepared for shipping. We'll email you once it leaves our warehouse.
        </StyledText>

        <View style={styles.buttonGroup}>
          <PremiumButton title="Continue Shopping" onPress={handleContinue} />
          
          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: theme.border, opacity: isFetchingReceipt ? 0.5 : 1 }]} 
            onPress={handlePrint}
            activeOpacity={0.7}
            disabled={isFetchingReceipt}
          >
            {isFetchingReceipt ? (
              <ActivityIndicator size="small" color={theme.text} style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="print-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
            )}
            <StyledText variant="body" style={{ color: theme.text, fontWeight: '600' }}>
              {isFetchingReceipt ? 'Loading Receipt...' : 'Print Receipt'}
            </StyledText>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { width: '100%', alignItems: 'center' },
  iconContainer: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: { textAlign: 'center', marginBottom: 16 },
  subtitle: { textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  buttonGroup: { width: '100%' },
  outlineButton: { 
    marginTop: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1 
  }
});