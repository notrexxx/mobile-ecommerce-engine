import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import { supabase } from '../../src/utils/supabase';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Sync Failed', text2: 'Could not load recent orders.' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged Out' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#34C759';
      case 'shipped': return '#007AFF';
      case 'cancelled': return '#FF3B30';
      case 'pending': default: return '#FF9500';
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const dateObj = new Date(item.createdAt || item.created_at);
    const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let itemCount = 0;
    try {
      const parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
      itemCount = parsedItems.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
    } catch (e) { }

    return (
      <TouchableOpacity style={[styles.orderCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push(`/(admin)/order-details?id=${item.id}`)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <StyledText variant="body" style={{ fontWeight: '700' }}>Order #{item.id.substring(0, 8).toUpperCase()}</StyledText>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <StyledText variant="caption" style={{ color: statusColor, fontWeight: '700', textTransform: 'uppercase', fontSize: 10 }}>{item.status || 'Pending'}</StyledText>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><Ionicons name="person-outline" size={16} color={theme.subtext} style={{ marginRight: 8 }} /><StyledText variant="body" style={{ color: theme.text }}>{item.customerEmail}</StyledText></View>
          <View style={styles.infoRow}><Ionicons name="time-outline" size={16} color={theme.subtext} style={{ marginRight: 8 }} /><StyledText variant="subtext">{formattedDate}</StyledText></View>
        </View>
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <StyledText variant="subtext">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</StyledText>
          <StyledText variant="h3" style={{ color: theme.primary }}>${Number(item.totalAmount).toFixed(2)}</StyledText>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 🚀 STANDARDIZED HEADER */}
      <View style={[styles.headerContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View>
          <StyledText variant="h1">Fulfillment</StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 4 }}>Manage customer orders.</StyledText>
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.replace('/')} style={[styles.pillBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Ionicons name="storefront-outline" size={18} color={theme.text} />
            <StyledText variant="body" style={[styles.pillText, { color: theme.text }]}>Store</StyledText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.pillBtn, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '10' }]}>
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <StyledText variant="body" style={[styles.pillText, { color: theme.danger }]}>Logout</StyledText>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="receipt-outline" size={64} color={theme.border} /><StyledText variant="body" style={{ color: theme.subtext, marginTop: 16 }}>No orders placed yet.</StyledText></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 24, borderBottomWidth: 1, flexWrap: 'wrap', gap: 16 },
  headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { fontWeight: '700', fontSize: 13, marginLeft: 6 },
  listContent: { padding: 24, paddingBottom: 100, maxWidth: 800, width: '100%', alignSelf: 'center' },
  orderCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, backgroundColor: '#88888808' },
  emptyState: { alignItems: 'center', marginTop: 100 }
});