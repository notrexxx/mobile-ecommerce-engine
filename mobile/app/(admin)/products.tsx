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
  Alert 
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

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { logout } = useAuth();
  const router = useRouter();

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // THE FIX: Changed 'created_at' to 'createdAt' to match the database schema
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Database Error', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
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

  const renderHeader = () => (
    <TouchableOpacity 
      style={[styles.mainAddBtn, { backgroundColor: theme.primary }]} 
      onPress={() => router.push('/(admin)/product-form')}
      activeOpacity={0.8}
    >
      <Ionicons name="add-circle-outline" size={24} color={theme.background} />
      <StyledText variant="body" style={{ color: theme.background, fontWeight: '700', marginLeft: 8 }}>
        Add New Product
      </StyledText>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: any }) => {
    const isOutOfStock = item.stock <= 0;

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {item.image_url || item.imageUrl ? (
          <Image source={{ uri: item.image_url || item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="hardware-chip-outline" size={40} color={theme.subtext} />
          </View>
        )}
        
        <View style={styles.details}>
          <View>
            <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</StyledText>
            <StyledText variant="caption" style={{ color: theme.subtext }}>${item.price.toFixed(2)} • {item.category || 'Tech'}</StyledText>
          </View>

          <View style={styles.stockBadgeRow}>
            <View style={[styles.badge, { backgroundColor: isOutOfStock ? '#FF3B30' : '#34C759' }]}>
              <StyledText variant="caption" style={styles.badgeText}>
                {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
              </StyledText>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.actionRow}>
            <View style={styles.stockController}>
              <TouchableOpacity onPress={() => handleAdjustStock(item, -1)} style={[styles.circleBtn, { borderColor: theme.border }]}>
                <Ionicons name="remove" size={16} color={theme.text} />
              </TouchableOpacity>
              
              <StyledText variant="body" style={{ fontWeight: '700', minWidth: 28, textAlign: 'center' }}>
                {item.stock || 0}
              </StyledText>
              
              <TouchableOpacity onPress={() => handleAdjustStock(item, 1)} style={[styles.circleBtn, { borderColor: theme.border }]}>
                <Ionicons name="add" size={16} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/(admin)/product-form', params: { productStr: JSON.stringify(item) } })} style={[styles.iconBtn, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.navButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <StyledText variant="h3">Inventory</StyledText>
          
          <TouchableOpacity onPress={handleLogout} style={[styles.navButton, { flexDirection: 'row', width: 'auto', paddingRight: 4 }]}>
            <Ionicons name="log-out-outline" size={24} color={theme.text} />
            <StyledText variant="body" style={{ fontWeight: '600', marginLeft: 6, display: Platform.OS === 'web' ? 'flex' : 'none' }}>Log Out</StyledText>
          </TouchableOpacity>
        </View>
      </BlurView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.text} /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: Platform.OS === 'ios' ? 110 : 90, paddingBottom: 120, paddingHorizontal: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  mainAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 24 },
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  image: { width: 110, height: '100%', resizeMode: 'cover', backgroundColor: '#E5E5EA' },
  details: { flex: 1, padding: 16 },
  stockBadgeRow: { marginTop: 8, flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#FFF', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  divider: { height: 1, width: '100%', marginVertical: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockController: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circleBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 40 },
});