import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, useColorScheme, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';

import { supabase } from '../../src/utils/supabase';
import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { logout } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Database Error', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged Out' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
    }
  };

  const handleDelete = async (productId: string) => {
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Product", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== productId));
            Toast.show({ type: 'success', text1: 'Product Deleted' });
          } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Delete Failed', text2: error.message });
          }
      }}
    ]);
  };

  const handleAdjustStock = async (product: any, amount: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStock = Math.max(0, (product.stock || 0) + amount);
    if (newStock === product.stock) return; 

    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));

    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
      if (error) throw error;
    } catch (error: any) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: product.stock } : p));
      Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= 10;
    const imageUrl = item.image_url || item.imageUrl;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.imageContainer}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={300} /> : <Ionicons name="hardware-chip-outline" size={32} color={theme.subtext} />}
        </View>
        <View style={styles.details}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <StyledText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>{item.name}</StyledText>
              <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 2 }}>${Number(item.price).toFixed(2)} • {item.category || 'Tech'}</StyledText>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => router.push(`/(admin)/product-form?id=${item.id}`)} style={[styles.iconBtn, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="pencil" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="trash" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.actionRow}>
            <View style={styles.stockController}>
              <TouchableOpacity onPress={() => handleAdjustStock(item, -1)} style={[styles.circleBtn, { borderColor: theme.border }]}><Ionicons name="remove" size={16} color={theme.text} /></TouchableOpacity>
              <StyledText variant="body" style={{ fontWeight: '700', minWidth: 32, textAlign: 'center' }}>{item.stock || 0}</StyledText>
              <TouchableOpacity onPress={() => handleAdjustStock(item, 1)} style={[styles.circleBtn, { borderColor: theme.border }]}><Ionicons name="add" size={16} color={theme.text} /></TouchableOpacity>
            </View>
            {isOutOfStock ? <StyledText variant="caption" style={{ color: '#FF3B30', fontWeight: '700' }}>OUT OF STOCK</StyledText> : isLowStock ? <StyledText variant="caption" style={{ color: '#FF9500', fontWeight: '700' }}>LOW INVENTORY</StyledText> : <StyledText variant="caption" style={{ color: '#34C759', fontWeight: '700' }}>IN STOCK</StyledText>}
          </View>
        </View>
      </View>
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
          <StyledText variant="h1">Inventory</StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 4 }}>Manage pricing and stock levels.</StyledText>
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
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="cube-outline" size={64} color={theme.border} /><StyledText variant="body" style={{ color: theme.subtext, marginTop: 16 }}>Your inventory is empty.</StyledText></View>}
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
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  imageContainer: { width: 100, height: '100%', backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  details: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockController: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#88888808' },
  iconBtn: { padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  emptyState: { alignItems: 'center', marginTop: 100 }
});