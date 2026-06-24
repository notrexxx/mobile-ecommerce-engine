import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useRouter, useFocusEffect } from 'expo-router';

import { supabase } from '../../src/utils/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'shipped'>('pending');

  const { user, logout } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*') 
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Database Error', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged Out', text2: 'You have been securely signed out.' });
      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'shipped' : 'pending';
    
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUpdating(orderId);

    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;

      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Status Updated', text2: `Order successfully marked as ${newStatus}.` });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert("Erase Order", "Are you sure you want to permanently delete this order? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setIsDeleting(orderId);
          try {
            const { error } = await supabase.from('orders').delete().eq('id', orderId);
            if (error) throw error;
            
            setOrders(prev => prev.filter(order => order.id !== orderId));
            if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({ type: 'success', text1: 'Order Erased' });
          } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Delete Failed', text2: error.message });
          } finally {
            setIsDeleting(null);
          }
        }
      }
    ]);
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const renderTabsHeader = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, { backgroundColor: activeTab === 'pending' ? theme.primary : 'transparent', borderColor: activeTab === 'pending' ? theme.primary : theme.border }]}
        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab('pending'); }}
      >
        <StyledText variant="caption" style={{ color: activeTab === 'pending' ? theme.background : theme.text, fontWeight: '600' }}>
          Pending ({orders.filter(o => o.status === 'pending').length})
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, { backgroundColor: activeTab === 'shipped' ? theme.primary : 'transparent', borderColor: activeTab === 'shipped' ? theme.primary : theme.border }]}
        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab('shipped'); }}
      >
        <StyledText variant="caption" style={{ color: activeTab === 'shipped' ? theme.background : theme.text, fontWeight: '600' }}>
          Shipped ({orders.filter(o => o.status === 'shipped').length})
        </StyledText>
      </TouchableOpacity>
    </View>
  );

  const renderOrderItem = ({ item }: { item: any }) => {
    const orderDate = new Date(item.createdAt || item.created_at).toLocaleDateString();
    const isPending = item.status === 'pending';

    const parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []);
    const itemCount = parsedItems.reduce((acc: number, cartItem: any) => acc + (cartItem.quantity || 0), 0);

    const finalUserId = item.userId || item.user_id;
    
    // THE FIX: Parse the shipping details to grab the name
    const shipping = typeof item.shippingDetails === 'string' ? JSON.parse(item.shippingDetails) : (item.shippingDetails || {});
    const displayName = shipping.name ? `${shipping.name} • ` : (finalUserId ? '' : 'Unknown User • ');

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(admin)/order-details', params: { orderStr: JSON.stringify(item) } })}
        style={[styles.orderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.orderHeader}>
          <View>
            <StyledText variant="caption" style={{ color: theme.subtext }}>Order ID: {item.id.substring(0, 8).toUpperCase()}</StyledText>
            <StyledText variant="body" style={{ fontWeight: '600', marginTop: 4 }}>
              {displayName}{item.customerEmail ? item.customerEmail : 'Legacy Order'}
            </StyledText>
          </View>
          <StyledText variant="h3">${Number(item.totalAmount || item.total || 0).toFixed(2)}</StyledText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.orderFooter}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isPending ? '#FF9500' : '#34C759' }]} />
            <StyledText variant="caption" style={{ color: theme.subtext, textTransform: 'capitalize' }}>
              {item.status} • {itemCount} items • {orderDate}
            </StyledText>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isPending ? theme.primary : theme.border, marginRight: 12 }]} 
              onPress={() => handleUpdateStatus(item.id, item.status)}
              disabled={isUpdating === item.id}
            >
              {isUpdating === item.id ? (
                <ActivityIndicator size="small" color={isPending ? theme.background : theme.text} />
              ) : (
                <StyledText variant="caption" style={{ color: isPending ? theme.background : theme.text, fontWeight: '600' }}>
                  {isPending ? 'Mark Shipped' : 'Revert Pending'}
                </StyledText>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#331111' : '#FFE5E5', paddingHorizontal: 12 }]} 
              onPress={() => handleDeleteOrder(item.id)}
              disabled={isDeleting === item.id}
            >
              {isDeleting === item.id ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <StyledText variant="h3">Admin Orders</StyledText>
          
          {user ? (
            <TouchableOpacity onPress={handleLogout} style={styles.authButtonWrapper}>
              <Ionicons name="log-out-outline" size={24} color={theme.text} />
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Log Out</StyledText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.authButtonWrapper}>
              <Ionicons name="person-outline" size={24} color={theme.text} />
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Log In</StyledText>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          ListHeaderComponent={renderTabsHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="file-tray-outline" size={48} color={theme.border} />
              <StyledText variant="body" style={{ color: theme.subtext, marginTop: 16 }}>
                No {activeTab} orders found.
              </StyledText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 80, alignItems: 'flex-start', justifyContent: 'center' },
  authButtonWrapper: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  authButtonText: { fontWeight: '600', marginLeft: 6 },
  listContent: { paddingTop: Platform.OS === 'ios' ? 110 : 90, paddingBottom: 120, paddingHorizontal: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  divider: { height: 1, width: '100%', marginVertical: 12 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});