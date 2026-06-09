import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: '1', name: 'Acoustic Studio Pro', category: 'Audio', price: 349.00, description: 'Active noise cancelling over-ear headphones with 40-hour battery life.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', stock: 10 },
  { id: '2', name: 'Mechanical Key/01', category: 'Peripherals', price: 199.00, description: 'Hot-swappable mechanical keyboard with low-profile tactile switches.', imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80', stock: 5 },
  { id: '3', name: 'Matte Grid Mouse', category: 'Peripherals', price: 89.00, description: 'Ultra-lightweight wireless optical mouse tailored for precision.', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80', stock: 15 },
  { id: '4', name: 'Alpha 8K Mirrorless', category: 'Photography', price: 1499.00, description: 'Premium full-frame mirrorless camera with advanced autofocus and 8K video capabilities.', imageUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80', stock: 6 },
  { id: '5', name: 'Quantum OLED Display', category: 'Displays', price: 999.00, description: '34-inch ultrawide OLED monitor with absolute true blacks and a 240Hz refresh rate.', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', stock: 8 },
  { id: '6', name: 'Lens Kit Pro 50mm', category: 'Photography', price: 850.00, description: 'Ultra-sharp 50mm prime lens with an f/1.4 aperture for incredible low-light performance.', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', stock: 12 },
  { id: '7', name: 'Vision Pro VR', category: 'Gaming', price: 499.00, description: 'Next-generation standalone virtual reality headset with spatial audio.', imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=80', stock: 4 },
  { id: '8', name: 'Wireless Controller', category: 'Gaming', price: 69.00, description: 'Ergonomic pro controller with adjustable trigger resistance and haptic feedback.', imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80', stock: 18 },
  { id: '9', name: 'Aero 4K Drone', category: 'Photography', price: 1299.00, description: 'Compact folding drone with a 3-axis gimbal and 4K/60fps video capabilities.', imageUrl: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=80', stock: 25 },
  { id: '10', name: 'Pro Tablet & Pen', category: 'Displays', price: 1099.00, description: '12.9-inch liquid retina display paired with a pressure-sensitive magnetic stylus.', imageUrl: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&q=80', stock: 30 },
  { id: '11', name: 'Podcast Pro Mic', category: 'Audio', price: 249.00, description: 'Dynamic studio-quality condenser microphone with integrated shock mount.', imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80', stock: 7 },
  { id: '12', name: 'Echo Home Hub', category: 'Audio', price: 129.00, description: 'High-fidelity smart speaker with integrated voice assistant and room-filling sound.', imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80', stock: 40 },
];

const CATEGORIES = ['All', 'Audio', 'Peripherals', 'Displays', 'Gaming', 'Photography', 'Accessories'];
const CARD_MARGIN = 16;
const MAX_CONTENT_WIDTH = 1440; 

export default function HomeScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('All');
  const { cart } = useCart();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  let numColumns = 2;
  if (width >= 1024) numColumns = 4; 
  else if (width >= 768) numColumns = 3; 

  const actualWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const CARD_WIDTH = (actualWidth - (CARD_MARGIN * (numColumns + 1))) / numColumns;

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCategoryPress = async (category: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const handleProductPress = async (product: any) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductDetails', { product });
  };

  const filteredProducts = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

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

  const renderProduct = ({ item }: { item: typeof PRODUCTS[0] }) => (
    <TouchableOpacity 
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.surface, borderColor: theme.border }]}
      activeOpacity={0.9}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      </View>
      <View style={styles.cardContent}>
        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 4 }}>{item.category}</StyledText>
        <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</StyledText>
        <StyledText variant="subtext" style={{ marginTop: 8 }}>${item.price.toFixed(2)}</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
      />

      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
            <Image source={require('../../assets/tech-logo.png')} style={[styles.headerLogo, { tintColor: theme.text }]} resizeMode="contain" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartIconWrapper}>
            <Ionicons name="bag-outline" size={24} color={theme.text} />
            {cartItemCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF3B30', borderColor: theme.background }]}>
                <StyledText variant="caption" style={[styles.badgeText, { color: '#FFFFFF' }]}>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </StyledText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { 
    position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth 
  },
  headerContent: { 
    paddingTop: Platform.OS === 'ios' ? 44 : 20, 
    paddingBottom: 8, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  headerLogo: { width: 150, height: 45 },
  cartIconWrapper: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5 },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700', letterSpacing: 0 },
  categoriesContainer: { marginBottom: 32 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  listContent: { 
    paddingTop: Platform.OS === 'ios' ? 110 : 90, 
    paddingBottom: 120, paddingHorizontal: CARD_MARGIN 
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  imageContainer: { 
    width: '100%', 
    height: 240, 
    backgroundColor: '#E5E5EA' 
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardContent: { padding: 12 },
});