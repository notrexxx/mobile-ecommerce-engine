import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#000000' : '#F2F2F7',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#EBEBF599' : '#3C3C4399',
    border: isDark ? '#38383A' : '#C6C6C8',
    primary: '#0A84FF',
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password });
      
      // Our NestJS backend automatically logs the user in upon registration!
      const { access_token, user } = response.data;

      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_profile', JSON.stringify(user));

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      navigation.replace('Home');
      
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const errorMessage = error.response?.data?.message || 'Registration failed. Email might be in use.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.centerWrapper}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Join today to access premium commerce.
          </Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary, opacity: isLoading ? 0.6 : 1 }]}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerButton} 
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={[styles.footerText, { color: theme.text }]}>
              Already have an account? <Text style={{ color: theme.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { width: '100%', maxWidth: 400, paddingHorizontal: 24 },
  title: { fontSize: 34, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 17, marginBottom: 32, lineHeight: 22 },
  inputContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  input: { height: 50, paddingHorizontal: 16, fontSize: 17 },
  divider: { height: 1, width: '100%' },
  button: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  footerButton: { alignItems: 'center', paddingVertical: 8 },
  footerText: { fontSize: 15 },
});