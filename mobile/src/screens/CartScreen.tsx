import React from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity, useColorScheme, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import PremiumButton from '../components/PremiumButton';
import { useCart, CartItem } from '../context/CartContext';

export default function CartScreen({ navigation }: any) {
  const { cart, addToCart, removeFromCart, getCartTotal } = useCart();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleIncrement = async (item: CartItem) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(item.product);
  };

  const handleDecrement = async (item: CartItem) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromCart(item.product.id);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { borderBottomColor: theme.border }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
      </View>
      <View style={styles.itemDetails}>
        <View>
          <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.product.name}</StyledText>
          <StyledText variant="subtext" style={{ marginTop: 4 }}>{item.product.category}</StyledText>
        </View>
        <View style={styles.priceRow}>
          <StyledText variant="h3">${(item.product.price * item.quantity).toFixed(2)}</StyledText>
          <View style={[styles.quantityContainer, { borderColor: theme.border }]}>
            <TouchableOpacity style={styles.controlButton} onPress={() => handleDecrement(item)}>
              <Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={16} color={item.quantity === 1 ? theme.danger : theme.text} />
            </TouchableOpacity>
            <StyledText variant="body" style={styles.quantity}>{item.quantity}</StyledText>
            <TouchableOpacity style={styles.controlButton} onPress={() => handleIncrement(item)} disabled={item.quantity >= item.product.stock}>
              <Ionicons name="add" size={16} color={item.quantity >= item.product.stock ? theme.subtext : theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Image source={require('../../assets/tech-logo.png')} style={[styles.headerLogo, { tintColor: theme.text }]} resizeMode="contain" />
          
          <View style={styles.iconButton} /> 
        </View>
      </BlurView>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={theme.subtext} style={{ marginBottom: 24 }} />
          <StyledText variant="h2" style={{ marginBottom: 8 }}>Your bag is empty.</StyledText>
          <StyledText variant="subtext" style={{ textAlign: 'center', marginBottom: 32 }}>Discover our premium hardware collection.</StyledText>
          <View style={{ width: '100%', maxWidth: 300 }}>
            <PremiumButton title="Shop Now" onPress={() => navigation.navigate('Home')} />
          </View>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.id}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {cart.length > 0 && (
        <BlurView intensity={85} tint={isDark ? 'dark' : 'light'} style={[styles.bottomBar, { borderTopColor: theme.border }]}>
          <View style={styles.bottomBarContent}>
            <View style={styles.totalRow}>
              <StyledText variant="subtext">Estimated Total</StyledText>
              <StyledText variant="h2">${getCartTotal().toFixed(2)}</StyledText>
            </View>
            <PremiumButton title="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} />
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { 
    paddingTop: Platform.OS === 'ios' ? 44 : 20, 
    paddingBottom: 8, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  headerLogo: { width: 150, height: 45 },
  iconButton: { width: 40, alignItems: 'flex-start' },
  listContent: { 
    paddingTop: Platform.OS === 'ios' ? 110 : 90, 
    paddingBottom: Platform.OS === 'ios' ? 180 : 160 
  },
  cartItem: { flexDirection: 'row', paddingVertical: 24, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth },
  imageContainer: { width: 96, height: 96, borderRadius: 16, backgroundColor: '#E5E5EA', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 4 },
  controlButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  quantity: { width: 24, textAlign: 'center', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', borderTopWidth: StyleSheet.hairlineWidth, zIndex: 20 },
  bottomBarContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 38 : 24, maxWidth: 600, width: '100%', alignSelf: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
});