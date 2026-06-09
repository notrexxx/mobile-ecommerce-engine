import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  useColorScheme,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import PremiumButton from '../components/PremiumButton';
import { useCart } from '../context/CartContext';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { product } = route.params;
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width, height } = useWindowDimensions();
  
  const isDesktop = width >= 768;

  const handleAddToCart = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAdding(true);
    addToCart(product);
    
    setTimeout(() => {
      setIsAdding(false);
      navigation.goBack();
    }, 600);
  };

  return (
    <View style={[styles.overlayContainer, { backgroundColor: isDesktop ? 'rgba(0,0,0,0.6)' : theme.background }]}>
      
      {isDesktop && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      )}

      <View 
        style={[
          styles.modalWindow, 
          { 
            backgroundColor: theme.background,
            width: isDesktop ? 540 : '100%', 
            height: isDesktop ? height * 0.90 : '100%',
            borderRadius: isDesktop ? 24 : 0,
            flexDirection: 'column', 
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.backButton, 
            { 
              backgroundColor: theme.surface,
              top: Platform.OS === 'ios' && !isDesktop ? 44 : 20 // Adjusted to exact slim layout
            }
          ]} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={[styles.imageSection, { height: isDesktop ? 400 : width, backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]} >
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
        </View>

        <ScrollView style={styles.detailsSection} contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
          <View>
            <StyledText variant="subtext" style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{product.category}</StyledText>
            <StyledText variant="h1" style={{ marginBottom: 16 }}>{product.name}</StyledText>
            <StyledText variant="h2" style={{ color: theme.subtext, marginBottom: 32 }}>${product.price.toFixed(2)}</StyledText>
            <StyledText variant="body" style={{ lineHeight: 24, marginBottom: 40 }}>{product.description}</StyledText>
          </View>

          <View style={styles.actionContainer}>
            <View style={styles.stockRow}>
              <View style={[styles.stockDot, { backgroundColor: product.stock > 0 ? '#34C759' : '#FF3B30' }]} />
              <StyledText variant="subtext">{product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}</StyledText>
            </View>
            <PremiumButton title={isAdding ? "Added to Bag" : "Add to Bag"} onPress={handleAddToCart} disabled={product.stock === 0} isLoading={isAdding} />
          </View>
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalWindow: { overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 24 },
  backButton: { position: 'absolute', left: 24, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  imageSection: { width: '100%', justifyContent: 'center', alignItems: 'center', padding: 24 },
  image: { width: '100%', height: '100%' },
  detailsSection: { flex: 1, width: '100%' },
  detailsContent: { padding: 32, flexGrow: 1, justifyContent: 'space-between' },
  actionContainer: { marginTop: 40, paddingBottom: Platform.OS === 'ios' ? 24 : 0 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
});