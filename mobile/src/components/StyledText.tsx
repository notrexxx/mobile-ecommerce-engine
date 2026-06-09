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

  // Automatically assign the correct color based on the variant
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
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});