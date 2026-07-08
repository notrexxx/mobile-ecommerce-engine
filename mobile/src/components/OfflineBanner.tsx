import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StyledText from './StyledText';
import { lightTheme, darkTheme } from '../theme/theme';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected || isConnected === null || Platform.OS === 'web') return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.danger, paddingTop: Math.max(insets.top, 20) }]}>
      <Ionicons name="cloud-offline" size={20} color="#FFFFFF" style={styles.icon} />
      <StyledText variant="body" style={styles.text}>
        No internet connection. Please check your network.
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 99,
  },
  icon: { marginRight: 8 },
  text: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});