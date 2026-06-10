import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Image,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { lightTheme, darkTheme } from '../theme/theme';
import StyledText from '../components/StyledText';
import PremiumButton from '../components/PremiumButton';
import PremiumInput from '../components/PremiumInput';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Bring in the auth context to check if a user is already logged in
  const { user } = useAuth();

  // Auth Guard: If the user is already authenticated, instantly redirect to Home
  useEffect(() => {
    if (user) {
      navigation.replace('Home');
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter your email and password.' });
      return;
    }

    setIsLoading(true);
    
    // Authenticate securely with Supabase
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    setIsLoading(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
      });
      navigation.replace('Home');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <TouchableOpacity 
        style={[
          styles.topLeftLogoContainer,
          {
            top: Platform.OS === 'ios' ? 44 : 20,
            left: isDesktop ? 48 : 16,
          }
        ]}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Image 
          source={require('../../assets/tech-logo.png')} 
          style={[styles.techLogo, { tintColor: theme.text }]} 
          resizeMode="contain"
        />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.squareIcon} />
            <StyledText variant="h1" style={styles.title}>Welcome Back</StyledText>
            <StyledText variant="subtext" style={styles.subtitle}>Sign in to access premium hardware.</StyledText>
          </View>

          <View style={styles.form}>
            <PremiumInput 
              placeholder="Email Address" 
              autoCapitalize="none" 
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
              editable={!isLoading} 
            />
            <PremiumInput 
              placeholder="Password" 
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
              editable={!isLoading} 
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <StyledText variant="caption" style={{ color: theme.subtext }}>Forgot Password?</StyledText>
            </TouchableOpacity>

            <PremiumButton title="Sign In" onPress={handleLogin} isLoading={isLoading} />
          </View>

          <View style={styles.footer}>
            <StyledText variant="subtext">Don't have an account? </StyledText>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <StyledText variant="body" style={{ color: theme.text, fontWeight: '700' }}>Create one</StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topLeftLogoContainer: { position: 'absolute', zIndex: 10 },
  techLogo: { width: 150, height: 45 },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', maxWidth: 400, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  squareIcon: { width: 64, height: 64, borderRadius: 16, marginBottom: 24 },
  title: { marginBottom: 8 },
  subtitle: { textAlign: 'center' },
  form: { width: '100%' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 32, marginTop: -4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
});