import React, { useState } from 'react';
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

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill out all fields.' });
      return;
    }
    
    setIsLoading(true);

    // Register securely with Supabase and pass the name to user metadata
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    setIsLoading(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Welcome to your premium setup.',
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
            <StyledText variant="h1" style={styles.title}>Create Account</StyledText>
            <StyledText variant="subtext" style={styles.subtitle}>Join to build your premium setup.</StyledText>
          </View>

          <View style={styles.form}>
            <PremiumInput placeholder="Full Name" value={name} onChangeText={setName} editable={!isLoading} />
            <PremiumInput placeholder="Email Address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!isLoading} />
            <PremiumInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} editable={!isLoading} />

            <View style={{ marginTop: 16 }}>
              <PremiumButton title="Sign Up" onPress={handleRegister} isLoading={isLoading} />
            </View>
          </View>

          <View style={styles.footer}>
            <StyledText variant="subtext">Already have an account? </StyledText>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <StyledText variant="body" style={{ color: theme.text, fontWeight: '700' }}>Sign In</StyledText>
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
  title: { marginBottom: 8 },
  subtitle: { textAlign: 'center' },
  form: { width: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
});