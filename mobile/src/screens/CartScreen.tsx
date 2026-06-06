import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCart, CartItem } from '../context/CartContext';

export default function CartScreen({ navigation }: any) {
  const { cart, addToCart, removeFromCart, getCartTotal } = useCart();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#000000' : '#F2F2F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#EBEBF599' : '#3C3C4399',
    border: isDark ? '#38383A' : '#C6C6C8',
    primary: '#0A84FF',
    danger: '#FF453A',
  };

  const handleIncrement = async (item: CartItem) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(item.product);
  };

  const handleDecrement = async (item: CartItem) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromCart(item.product.id);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
      
      <View style={styles.itemDetails}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={[styles.price, { color: theme.text }]}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.background }]} 
            onPress={() => handleDecrement(item)}
          >
            <Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={16} color={item.quantity === 1 ? theme.danger : theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.quantity, { color: theme.text }]}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.background }]} 
            onPress={() => handleIncrement(item)}
            disabled={item.quantity >= item.product.stock}
          >
            <Ionicons name="add" size={16} color={item.quantity >= item.product.stock ? theme.subtext : theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="cart-outline" size={80} color={theme.subtext} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your bag is empty.</Text>
        <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
          When you add products, they'll appear here.
        </Text>
        <TouchableOpacity 
          style={[styles.shopButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopButtonText}>Shop Premium Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Checkout Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            ${getCartTotal().toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 120 },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: { fontSize: 16, fontWeight: '600', marginHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  shopButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  shopButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 17, fontWeight: '600' },
  totalAmount: { fontSize: 22, fontWeight: '700' },
  checkoutButton: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  checkoutText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});