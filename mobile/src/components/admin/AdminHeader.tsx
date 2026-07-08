import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { lightTheme, darkTheme } from '../../theme/theme';
import StyledText from '../StyledText';

export default function AdminHeader({ title, subtitle }: { title: string, subtitle: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const handleStorefront = () => {
    // 🚀 THE FIX: Now that the path collision is dead, this guarantees an escape to the storefront!
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // We wipe the user context. The Layout File intercepts this and handles the routing safely!
    await logout();
  };

  return (
    <View style={[styles.headerContainer, { borderBottomColor: theme.border }]}>
      <View>
        <StyledText variant="h1">{title}</StyledText>
        <StyledText variant="body" style={{ color: theme.subtext, marginTop: 4 }}>{subtitle}</StyledText>
      </View>
      <View style={styles.headerIcons}>
        
        <TouchableOpacity onPress={handleStorefront} style={[styles.pillBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="storefront-outline" size={18} color={theme.text} />
          <StyledText variant="body" style={{ marginLeft: 6, fontWeight: '700', color: theme.text }}>Store</StyledText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={[styles.pillBtn, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '10' }]}>
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <StyledText variant="body" style={{ marginLeft: 6, fontWeight: '700', color: theme.danger }}>Logout</StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 24, borderBottomWidth: 1, flexWrap: 'wrap', gap: 16 },
  headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 }
});