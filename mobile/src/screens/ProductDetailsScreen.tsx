import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { product } = route.params;
  const { addToCart } = useCart();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1C1C1E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#EBEBF599' : '#3C3C4399',
    primary: '#0A84FF',
  };

  const handleAddToBag = async () => {
    addToCart(product);
    
    // Provide instant feedback across all platforms
    if (Platform.OS === 'web') {
      window.alert(`${product.name} has been added to your bag.`);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Added to Bag', `${product.name} has been added to your bag.`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerWrapper}>
          <View style={styles.responsiveContent}>
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
            
            <View style={styles.infoContainer}>
              <Text style={[styles.category, { color: theme.subtext }]}>{product.category.toUpperCase()}</Text>
              <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>
              <Text style={[styles.price, { color: theme.text }]}>${product.price.toFixed(2)}</Text>
              
              <View style={[styles.divider, { backgroundColor: theme.surface }]} />
              
              <Text style={[styles.descriptionTitle, { color: theme.text }]}>Overview</Text>
              <Text style={[styles.description, { color: theme.subtext }]}>{product.description}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Premium Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.surface }]}>
        <View style={styles.centerWrapper}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            activeOpacity={0.8}
            onPress={handleAddToBag}
          >
            <Text style={styles.buttonText}>Add to Bag</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  responsiveContent: {
    width: '100%',
    maxWidth: 800,
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
    backgroundColor: '#E5E5EA',
  },
  infoContainer: {
    padding: 24,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 34,
  },
  price: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
    maxWidth: 400,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});