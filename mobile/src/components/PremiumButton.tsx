import React, { useRef } from 'react';
import { 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable, 
  useColorScheme,
  ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { lightTheme, darkTheme } from '../theme/theme';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
}

export default function PremiumButton({ 
  title, 
  onPress, 
  isLoading = false, 
  disabled = false,
  variant = 'solid' 
}: PremiumButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isSolid = variant === 'solid';

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], width: '100%' }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          {
            backgroundColor: isSolid ? theme.primary : 'transparent',
            borderColor: theme.primary,
            borderWidth: isSolid ? 0 : 1,
            opacity: disabled || isLoading ? 0.6 : 1,
          }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={isSolid ? theme.background : theme.primary} />
        ) : (
          <Text style={[
            styles.text, 
            { color: isSolid ? theme.background : theme.primary }
          ]}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontFamily: 'Inter_700Bold', // <-- THE FIX: Explicitly forcing the loaded font
    fontSize: 17,
    letterSpacing: 0.5,
  },
});