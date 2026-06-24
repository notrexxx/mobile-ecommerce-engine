import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  useColorScheme,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter, useFocusEffect } from 'expo-router'; 

import { lightTheme, darkTheme } from '../src/theme/theme';
import StyledText from '../src/components/StyledText';
import { useCart } from '../src/context/CartContext';
import { AuthContext } from '../src/context/AuthContext'; 
// 🚀 THE FIX: Swapped apiClient for supabase!
import { supabase } from '../src/utils/supabase';

const CATEGORIES = ['All', 'Audio', 'Peripherals', 'Displays', 'Gaming', 'Photography', 'Accessories'];
const CARD_MARGIN = 16;
const MAX_CONTENT_WIDTH = 1440;

export default function HomeScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderCount, setOrderCount] = useState(0);

  const { cart } = useCart();
  
  const { user, logout } = useContext(AuthContext)!; 
  const isAdmin = user?.role === 'admin';

  const router = useRouter();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  let numColumns = 2;
  if (width >= 1024) numColumns = 4;
  else if (width >= 768) numColumns = 3;

  const actualWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const CARD_WIDTH = (actualWidth - (CARD_MARGIN * (numColumns + 1))) / numColumns;

  const cartItemCount = cart ? cart.reduce((total: any, item: any) => total + item.quantity, 0) : 0;

  // 🚀 THE FIX: Fetch directly from Supabase instead of a backend server
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products from Supabase:', error);
      setProducts([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🚀 THE FIX: Count orders directly from Supabase
  const fetchOrderCount = useCallback(async () => {
    if (isAdmin) {
      try {
        const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        if (error) throw error;
        setOrderCount(count || 0); 
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrderCount(0);
      }
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      if (isAdmin) fetchOrderCount();
    }, [fetchProducts, fetchOrderCount, isAdmin])
  );

  const handleCategoryPress = async (category: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const handleProductPress = async (product: any) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/product/${product.id}`); 
  };

  const handleAdminNav = async (routePath: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(routePath as any);
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been securely signed out.',
      });
      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: error.message || 'An error occurred.',
      });
    }
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const hasInventory = p.stock > 0;
    return matchesCategory && hasInventory;
  });

  const renderListHeader = () => (
    <View style={styles.categoriesContainer}>
      <StyledText variant="h2" style={{ marginBottom: 16 }}>Discover</StyledText>
      <View style={styles.categories}>
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategoryPress(category)}
              style={[styles.categoryPill, { backgroundColor: isActive ? theme.primary : 'transparent', borderColor: isActive ? theme.primary : theme.border }]}
            >
              <StyledText variant="caption" style={{ color: isActive ? theme.background : theme.text }}>{category}</StyledText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.surface, borderColor: theme.border }]}
      activeOpacity={0.9}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
           <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <Ionicons name="hardware-chip-outline" size={48} color={theme.subtext} />
           </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 4 }}>{item.category || 'Tech'}</StyledText>
        <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</StyledText>
        <StyledText variant="subtext" style={{ marginTop: 8 }}>${Number(item.price).toFixed(2)}</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListHeaderComponent={renderListHeader}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center' }]}
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: CARD_MARGIN, marginBottom: CARD_MARGIN }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="cube-outline" size={48} color={theme.border} />
              <StyledText variant="body" style={{ color: theme.subtext, marginTop: 16 }}>
                No products available at the moment.
              </StyledText>
            </View>
          }
        />
      )}

      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8}>
            <Image source={require('../assets/tech-logo.png')} style={[styles.headerLogo, { tintColor: theme.text }]} resizeMode="contain" />
          </TouchableOpacity>

          <View style={styles.actionIcons}>
            
            {isAdmin && (
              <>
                <TouchableOpacity
                  onPress={() => handleAdminNav('/(admin)/products')}
                  style={styles.authButtonWrapper}
                >
                  <Ionicons name="cube-outline" size={24} color={theme.text} />
                  <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Products</StyledText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdminNav('/(admin)/orders')}
                  style={styles.authButtonWrapper}
                >
                  <View style={{ position: 'relative' }}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={theme.text} />
                    {orderCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#FF9500', top: -4, right: -4 }]}>
                        <StyledText variant="caption" style={[styles.badgeText, { color: '#FFFFFF' }]}>
                          {orderCount > 99 ? '99+' : orderCount}
                        </StyledText>
                      </View>
                    )}
                  </View>
                  <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Orders</StyledText>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => router.push('/cart')} style={styles.authButtonWrapper}>
              <View style={{ position: 'relative' }}>
                <Ionicons name="bag-outline" size={24} color={theme.text} />
                {cartItemCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#FF3B30', top: -4, right: -4 }]}>
                    <StyledText variant="caption" style={[styles.badgeText, { color: '#FFFFFF' }]}>
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </StyledText>
                  </View>
                )}
              </View>
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Cart</StyledText>
            </TouchableOpacity>

            {user ? (
              <TouchableOpacity onPress={handleLogout} style={styles.authButtonWrapper}>
                <Ionicons name="log-out-outline" size={24} color={theme.text} />
                <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Log Out</StyledText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.authButtonWrapper}>
                <Ionicons name="person-outline" size={24} color={theme.text} />
                <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Log In</StyledText>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBlur: {
    position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  headerLogo: { width: 150, height: 45 },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { padding: 8, marginLeft: 8, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  authButtonWrapper: { flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: 4 },
  authButtonText: { fontWeight: '600', marginLeft: 6, display: Platform.OS === 'web' ? 'flex' : 'none' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5 },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700', letterSpacing: 0 },
  categoriesContainer: { marginBottom: 32 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  listContent: { paddingTop: Platform.OS === 'ios' ? 110 : 90, paddingBottom: 120, paddingHorizontal: CARD_MARGIN },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  imageContainer: { width: '100%', height: 240, backgroundColor: '#E5E5EA' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardContent: { padding: 12 },
});