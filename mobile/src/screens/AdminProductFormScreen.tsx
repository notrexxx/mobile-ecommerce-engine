import React, { useState } from 'react';
import { View, StyleSheet, Platform, useColorScheme, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { supabase } from '../utils/supabase';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';

export default function AdminProductFormScreen({ route, navigation }: any) {
  // If a product is passed in route.params, we are in Edit Mode
  const editingProduct = route.params?.product || null;

  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [price, setPrice] = useState(editingProduct?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(editingProduct?.image_url || editingProduct?.imageUrl || '');
  const [category, setCategory] = useState(editingProduct?.category || '');
  const [stock, setStock] = useState(editingProduct?.stock?.toString() || '10');
  
  const [isSaving, setIsSaving] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const handleSave = async () => {
    if (!name || !price || !imageUrl || !category || !stock) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill out all required fields.' });
      return;
    }

    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      image_url: imageUrl,
      category,
      stock: parseInt(stock, 10),
    };

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        Toast.show({ type: 'success', text1: 'Product Updated' });
      } else {
        // Create
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        Toast.show({ type: 'success', text1: 'Product Created' });
      }
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Save Failed', text2: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <StyledText variant="h3">{editingProduct ? 'Edit Product' : 'New Product'}</StyledText>
          <View style={styles.iconButton} />
        </View>
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Product Name</StyledText>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={name} onChangeText={setName} placeholder="e.g., RTX 4090" placeholderTextColor={theme.subtext} />

        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Price ($)</StyledText>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="1599.99" placeholderTextColor={theme.subtext} />

        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Initial Stock</StyledText>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="10" placeholderTextColor={theme.subtext} />

        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Category</StyledText>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={category} onChangeText={setCategory} placeholder="GPU, CPU, Case..." placeholderTextColor={theme.subtext} />

        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Image URL</StyledText>
        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." autoCapitalize="none" placeholderTextColor={theme.subtext} />

        <StyledText variant="caption" style={{ color: theme.subtext, marginBottom: 8 }}>Description</StyledText>
        <TextInput style={[styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Product details..." placeholderTextColor={theme.subtext} />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={theme.background} /> : <StyledText variant="body" style={{ color: theme.background, fontWeight: '700' }}>{editingProduct ? 'Update Product' : 'Save New Product'}</StyledText>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  iconButton: { width: 40, alignItems: 'center' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 110 : 90, paddingBottom: 120, paddingHorizontal: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24, height: 120, textAlignVertical: 'top' },
  saveButton: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});