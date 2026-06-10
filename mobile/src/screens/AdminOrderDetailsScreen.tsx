import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';

export default function AdminOrderDetailsScreen({ route, navigation }: any) {
  const { order } = route.params;
  const { user, signOut } = useAuth();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const orderDate = new Date(order.created_at).toLocaleString();
  const isPending = order.status === 'pending';

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been securely signed out.',
      });
      navigation.replace('Login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { paddingHorizontal: isDesktop ? 48 : 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <StyledText variant="h3">Order Summary</StyledText>
          
          {user ? (
            <TouchableOpacity onPress={handleLogout} style={styles.authButtonWrapper}>
              <Ionicons name="log-out-outline" size={24} color={theme.text} />
              <StyledText variant="body" style={[styles.authButtonText, { color: theme.text }]}>Log Out</StyledText>
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>
      </BlurView>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoHeader}>
            <StyledText variant="h3">ID: {order.id.substring(0, 8).toUpperCase()}</StyledText>
            <View style={[styles.statusBadge, { backgroundColor: isPending ? '#FF9500' : '#34C759' }]}>
              <StyledText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' }}>
                {order.status}
              </StyledText>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Customer</StyledText>
            <StyledText variant="body" style={{ fontWeight: '600' }}>{order.profiles?.email || 'Unknown User'}</StyledText>
          </View>
          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Date Placed</StyledText>
            <StyledText variant="body" style={{ fontWeight: '600' }}>{orderDate}</StyledText>
          </View>
          <View style={styles.infoRow}>
            <StyledText variant="body" style={{ color: theme.subtext }}>Total Value</StyledText>
            <StyledText variant="h3">${Number(order.total).toFixed(2)}</StyledText>
          </View>
        </View>

        <StyledText variant="h2" style={styles.sectionTitle}>Purchased Items</StyledText>
        
        {order.items?.map((item: any, index: number) => (
          <View key={index} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.product.imageUrl || item.product.image_url }} style={styles.image} />
            </View>
            <View style={styles.itemDetails}>
              <View>
                <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{item.product.name}</StyledText>
                <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 4 }}>{item.product.category}</StyledText>
              </View>
              <View style={styles.itemPriceRow}>
                <StyledText variant="body" style={{ fontWeight: '600' }}>{item.quantity}x</StyledText>
                <StyledText variant="body" style={{ fontWeight: '600' }}>${(item.product.price * item.quantity).toFixed(2)}</StyledText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', zIndex: 999, elevation: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 80, alignItems: 'flex-start', justifyContent: 'center' },
  authButtonWrapper: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  authButtonText: { fontWeight: '600', marginLeft: 6 },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 120 : 100, paddingBottom: 120, paddingHorizontal: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 32 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { marginBottom: 16 },
  itemCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  imageContainer: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E5E5EA', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
});