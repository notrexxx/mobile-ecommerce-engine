import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import PremiumButton from '../../src/components/PremiumButton';
import { supabase } from '../../src/utils/supabase';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load order details.' });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchOrderDetails();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      Toast.show({ type: 'success', text1: 'Status Updated', text2: `Order marked as ${newStatus}.` });
    } catch (err) {
      console.error('Update failed:', err);
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Could not update status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <StyledText variant="body" style={{ color: theme.danger }}>Order not found.</StyledText>
        {/* 🚀 FIXED: Hardwired to Orders List */}
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.push('/(admin)/orders')}>
          <StyledText variant="body" style={{ color: theme.primary }}>Go Back</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  // Safely parse JSON strings from the database
  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  const shipping = typeof order.shippingDetails === 'string' ? JSON.parse(order.shippingDetails) : (order.shippingDetails || {});
  
  const dateObj = new Date(order.createdAt || order.created_at);
  const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* 🚀 FIXED: Hardwired to Orders List */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(admin)/orders')}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <StyledText variant="body" style={{ fontWeight: '700' }}>Order Details</StyledText>
          <StyledText variant="caption" style={{ color: theme.subtext }}>#{order.id.substring(0, 8).toUpperCase()}</StyledText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* CURRENT STATUS */}
        <View style={[styles.statusBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <StyledText variant="caption" style={{ color: theme.subtext, textTransform: 'uppercase', letterSpacing: 1 }}>Current Status</StyledText>
          <StyledText variant="h2" style={{ marginTop: 4, textTransform: 'capitalize', color: order.status === 'delivered' ? '#34C759' : theme.text }}>
            {order.status || 'Pending'}
          </StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 8 }}>Placed on {formattedDate}</StyledText>
        </View>

        {/* CUSTOMER & SHIPPING */}
        <View style={styles.section}>
          <StyledText variant="h3" style={{ marginBottom: 16 }}>Fulfillment Details</StyledText>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={theme.subtext} />
              <View style={styles.infoTextContainer}>
                <StyledText variant="caption" style={{ color: theme.subtext }}>Customer Email</StyledText>
                <StyledText variant="body">{order.customerEmail}</StyledText>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={20} color={theme.subtext} />
              <View style={styles.infoTextContainer}>
                <StyledText variant="caption" style={{ color: theme.subtext }}>Shipping Address</StyledText>
                <StyledText variant="body">{shipping.name || 'N/A'}</StyledText>
                <StyledText variant="body" style={{ color: theme.subtext }}>{shipping.address}</StyledText>
                <StyledText variant="body" style={{ color: theme.subtext }}>{shipping.city}, {shipping.zipCode}</StyledText>
              </View>
            </View>
          </View>
        </View>

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <StyledText variant="h3" style={{ marginBottom: 16 }}>Items Purchased</StyledText>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {parsedItems.map((item: any, index: number) => (
              <View key={index} style={[styles.itemRow, index !== parsedItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <StyledText variant="body" style={{ fontWeight: '600' }}>{item.name}</StyledText>
                  <StyledText variant="subtext">Qty: {item.quantity}</StyledText>
                </View>
                <StyledText variant="body" style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</StyledText>
              </View>
            ))}
            
            <View style={[styles.totalRow, { backgroundColor: theme.background }]}>
              <StyledText variant="body" style={{ fontWeight: '700' }}>Total Paid</StyledText>
              <StyledText variant="h3" style={{ color: theme.primary }}>${Number(order.totalAmount).toFixed(2)}</StyledText>
            </View>
          </View>
        </View>

        {/* UPDATE ACTIONS */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <StyledText variant="h3" style={{ marginBottom: 16 }}>Update Status</StyledText>
          
          <View style={{ gap: 12 }}>
            {order.status !== 'shipped' && (
              <PremiumButton 
                title="Mark as Shipped" 
                onPress={() => handleUpdateStatus('shipped')} 
                isLoading={isUpdating && order.status === 'shipped'} 
              />
            )}
            {order.status !== 'delivered' && (
              <PremiumButton 
                title="Mark as Delivered" 
                onPress={() => handleUpdateStatus('delivered')} 
                isLoading={isUpdating && order.status === 'delivered'} 
              />
            )}
            
            <TouchableOpacity 
              style={[styles.dangerButton, { borderColor: theme.danger }]}
              onPress={() => handleUpdateStatus('cancelled')}
              disabled={isUpdating}
            >
              <StyledText variant="body" style={{ color: theme.danger, fontWeight: '600' }}>Cancel Order</StyledText>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16, borderWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  content: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' },
  statusBox: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 32 },
  section: { marginBottom: 32 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', padding: 20 },
  infoTextContainer: { marginLeft: 16, flex: 1 },
  divider: { height: 1, width: '100%' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#00000010' },
  dangerButton: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginTop: 12 }
});