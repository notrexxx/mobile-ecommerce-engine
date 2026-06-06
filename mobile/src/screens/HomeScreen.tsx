import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { Product, useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Bring in the global cart to read the item count
  const { getCartCount } = useCart();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#000000' : '#F2F2F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#EBEBF599' : '#3C3C4399',
    primary: '#0A84FF',
  };

  // Dynamically inject the Cart button into the native header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Cart')}
          style={{ marginRight: Platform.OS === 'web' ? 16 : 0 }}
        >
          <View>
            <Ionicons name="bag-outline" size={24} color={theme.primary} />
            {getCartCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getCartCount()}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, getCartCount, theme.primary]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = async (product: Product) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    navigation.navigate('ProductDetails', { product });
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      activeOpacity={0.9}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.category, { color: theme.subtext }]}>{item.category.toUpperCase()}</Text>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.price, { color: theme.text }]}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '48%', borderRadius: 16, overflow: 'hidden' },
  productImage: { width: '100%', height: 160, backgroundColor: '#E5E5EA' },
  cardContent: { padding: 12 },
  category: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  productName: { fontSize: 15, fontWeight: '600', marginBottom: 8, lineHeight: 20, height: 40 },
  price: { fontSize: 17, fontWeight: '700' },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#FF453A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 4 },
});