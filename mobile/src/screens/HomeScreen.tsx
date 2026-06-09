import React, { useState, useEffect } from 'react';
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
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabase'; // The new live database connection

const CATEGORIES = ['All', 'Audio', 'Peripherals', 'Displays', 'Gaming', 'Photography', 'Accessories'];
const CARD_MARGIN = 16;
const MAX_CONTENT_WIDTH = 1440; 

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Live Database Fetch
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        
        if (data) {
          // Map database snake_case to the camelCase our UI expects
          const formattedData = data.map(item => ({
            ...item,
            imageUrl: item.image_url,
            price: Number(item.price) // Ensure price comes through as a number
          }));
          setProducts(formattedData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryPress = async (category: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const handleProductPress = async (product: any) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductDetails', { product });
  };

  const filteredProducts = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);

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
        />
      )}

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