import React from 'react';
import { View, StyleSheet, Platform, useColorScheme, Image, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';

export default function AdminOrderDetailsScreen() {
  const router = useRouter();
  const { orderStr } = useLocalSearchParams();
  const order = orderStr ? JSON.parse(orderStr as string) : null;
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (!order) return null;

  const orderDate = new Date(order.createdAt || order.created_at).toLocaleString();
  const isPending = order.status === 'pending';
  const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  
  // Parse the shipping JSON
  const shipping = typeof order.shippingDetails === 'string' ? JSON.parse(order.shippingDetails) : (order.shippingDetails || {});

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <StyledText variant="h3">Order Details</StyledText>
          <View style={styles.iconButton} />
        </View>
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Core Info Box */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoHeader}>
            <StyledText variant="h3">ID: {order.id.substring(0, 8).toUpperCase()}</StyledText>
            <View style={[styles.statusBadge, { backgroundColor: isPending ? '#FF9500' : '#34C759' }]}>
              <StyledText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' }}>{order.status}</StyledText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          {/* THE FIX: Stacked Name on top of Email cleanly */}
          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Customer</StyledText>
            <View style={{ alignItems: 'flex-end' }}>
              <StyledText variant="body" style={{ fontWeight: '600' }}>{shipping.name || 'Unknown Name'}</StyledText>
              <StyledText variant="caption" style={{ color: theme.subtext }}>{order.customerEmail || 'Legacy Order'}</StyledText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Date Placed</StyledText>
            <StyledText variant="body" style={{ fontWeight: '600' }}>{orderDate}</StyledText>
          </View>
          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Stripe TXN</StyledText>
            <StyledText variant="caption" style={{ fontWeight: '600', color: theme.primary }}>{order.stripePaymentId || 'N/A'}</StyledText>
          </View>
        </View>

        {/* Shipping Box */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 32 }]}>
          <StyledText variant="h3" style={{ marginBottom: 16 }}>Shipping Destination</StyledText>
          <StyledText variant="body" style={{ fontWeight: '600' }}>{shipping.address || 'No Address Provided'}</StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 4 }}>
            {shipping.city ? `${shipping.city}, ${shipping.zipCode}` : ''}
          </StyledText>
        </View>

        <StyledText variant="h2" style={styles.sectionTitle}>Purchased Items</StyledText>
        
        {parsedItems.map((item: any, index: number) => (
          <View key={index} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.imageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="hardware-chip-outline" size={40} color={theme.subtext} />
                </View>
              )}
            </View>
            <View style={styles.itemDetails}>
              <View>
                <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</StyledText>
              </View>
              <View style={styles.itemPriceRow}>
                <StyledText variant="body" style={{ fontWeight: '600' }}>{item.quantity}x</StyledText>
                <StyledText variant="body" style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</StyledText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 80, alignItems: 'flex-start', justifyContent: 'center' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 120 : 100, paddingBottom: 120, paddingHorizontal: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { marginBottom: 16 },
  itemCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  imageContainer: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E5E5EA', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
});