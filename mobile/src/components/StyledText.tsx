import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';

interface StyledTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'subtext' | 'caption';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export default function StyledText({ 
  style, 
  variant = 'body', 
  align = 'left',
  ...props 
}: StyledTextProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const getTextColor = () => {
    if (variant === 'subtext' || variant === 'caption') return theme.subtext;
    return theme.text;
  };

  return (
    <Text 
      style={[
        styles[variant], 
        { color: getTextColor(), textAlign: align },
        style
      ]} 
      {...props} 
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: 'Inter_700Bold', // Explicitly forced
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold', // Explicitly forced
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold', // Explicitly forced
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter_400Regular', // Explicitly forced
    fontSize: 16,
    lineHeight: 24,
  },
  subtext: {
    fontFamily: 'Inter_400Regular', // Explicitly forced
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter_500Medium', // Explicitly forced (Make sure this is in your _layout.tsx!)
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});