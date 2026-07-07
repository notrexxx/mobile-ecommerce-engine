import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import PremiumInput from '../../src/components/PremiumInput';
import PremiumButton from '../../src/components/PremiumButton';
import { supabase } from '../../src/utils/supabase';

export default function EditProductScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [isLoading, setIsLoading] = useState(false);
  
  // Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSaveProduct = async () => {
    // 1. Validation
    if (!name || !price || !stock) {
      return Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Name, price, and stock are required.' });
    }

    setIsLoading(true);

    try {
      // 2. Format data for database
      const newProduct = {
        name,
        category: category || 'General',
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description: description || '',
        imageUrl: imageUrl || ''
      };

      // 3. Insert directly into Supabase
      const { error } = await supabase.from('products').insert([newProduct]);

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Product Created', text2: `${name} has been added to inventory.` });
      
      // Navigate back to the dashboard/products list
      router.back();

    } catch (error: any) {
      console.error("Error creating product:", error);
      Toast.show({ type: 'error', text1: 'Creation Failed', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.background }}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <StyledText variant="h2">Add New Product</StyledText>
        <View style={{ width: 40 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <StyledText variant="h3" style={{ marginBottom: 20 }}>Core Details</StyledText>
          
          <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Product Name *</StyledText>
          <PremiumInput placeholder="e.g. Wireless Pro Headphones" value={name} onChangeText={setName} />

          <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Category</StyledText>
          <PremiumInput placeholder="e.g. Audio, Displays, Gaming" value={category} onChangeText={setCategory} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Price ($) *</StyledText>
              <PremiumInput placeholder="0.00" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Initial Stock *</StyledText>
              <PremiumInput placeholder="0" keyboardType="number-pad" value={stock} onChangeText={setStock} />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <StyledText variant="h3" style={{ marginBottom: 20 }}>Media & Description</StyledText>
          
          <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Image URL</StyledText>
          <PremiumInput placeholder="https://example.com/image.png" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

          <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8, marginLeft: 4 }}>Description</StyledText>
          <PremiumInput 
            placeholder="Write a compelling description for this product..." 
            value={description} 
            onChangeText={setDescription} 
            multiline 
          />
        </View>

        <View style={{ paddingVertical: 24 }}>
          <PremiumButton title="Publish Product" onPress={handleSaveProduct} isLoading={isLoading} />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16, borderWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  content: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center' },
  card: { padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
});