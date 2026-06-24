import React, { useState } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  StyleSheet, 
  View, 
  useColorScheme,
  Platform
} from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from './StyledText';

interface PremiumInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function PremiumInput({ 
  label, 
  error, 
  style, 
  onFocus, 
  onBlur, 
  ...props 
}: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  let currentBorderColor = theme.border;
  if (error) {
    currentBorderColor = theme.danger;
  } else if (isFocused) {
    currentBorderColor = theme.primary;
  }

  return (
    <View style={styles.container}>
      {label && (
        <StyledText variant="caption" style={styles.label}>
          {label}
        </StyledText>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: currentBorderColor,
            fontFamily: 'Inter_400Regular', // <-- THE FIX: Aggressively applied inline
            ...Platform.select({
              ios: {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isFocused ? 0.05 : 0,
                shadowRadius: 4,
              },
              web: {
                boxShadow: isFocused ? `0px 2px 8px rgba(0,0,0,0.05)` : 'none',
              } as any
            })
          },
          style,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        placeholderTextColor={theme.subtext}
        {...props}
      />
      
      {error && (
        <StyledText variant="caption" style={[styles.error, { color: theme.danger }]}>
          {error}
        </StyledText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    marginTop: 6,
    marginLeft: 4,
  },
});