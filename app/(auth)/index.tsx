import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { typography } from '@/constants/font';
import { getDeviceInfo, getLogoSize, getCenteringLayout } from '@/utils/deviceUtils';
import Logo from '@/components/common/Logo';

// Get screen dimensions and device info for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const deviceInfo = getDeviceInfo();
const logoSize = getLogoSize();
const centeringLayout = getCenteringLayout();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F5F5F7"
        translucent={false}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.centerWrapper}>
            <View style={styles.logoContainer}>
              <Logo variant="full" />
              {/* <Text style={styles.title}>Sales Team Portal</Text> */}
              {/* <Text style={styles.subtitle}></Text> */}
            </View>

            <View style={styles.formContainer}>
          <Text style={styles.formTitle}>User Login</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Mail color="#5A5A5A" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#5A5A5A"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#5A5A5A" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#5A5A5A"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              {isPasswordVisible ?
                <EyeOff color="#5A5A5A" size={20} /> :
                <Eye color="#5A5A5A" size={20} />
              }
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: centeringLayout.shouldCenterVertically ? 'center' : 'flex-start',
    paddingTop: deviceInfo.isSmallScreen ? 
      deviceInfo.statusBarHeight + 20 : // Small screens: minimal top padding
      deviceInfo.statusBarHeight + deviceInfo.safeAreaPadding, // Larger screens: standard padding
    paddingBottom: 20,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: centeringLayout.shouldCenterVertically ? 'center' : 'flex-start',
    alignItems: 'center', // Center everything horizontally
    paddingHorizontal: centeringLayout.containerPadding,
    paddingTop: deviceInfo.isSmallScreen ? 20 : 0, // Extra top padding for small screens
    minHeight: centeringLayout.shouldCenterVertically ? 
      screenHeight - (deviceInfo.statusBarHeight + deviceInfo.safeAreaPadding + 40) : 
      'auto',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: centeringLayout.formSpacing, // Dynamic spacing between logo and form
    width: '100%',
  },
  logoPlaceholder: {
    width: logoSize.width,
    height: logoSize.height,
    borderRadius: 0,
  },
  logoLoading: {
    opacity: 0.5,
  },
  logoLoadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: logoSize.width,
    height: logoSize.height,
  },
  title: {
    fontSize: 24,
    color: '#002EDC',
    marginTop: 12,
    fontWeight: '900',
    fontFamily: typography.primary,
    textShadowColor: 'rgba(0, 46, 220, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontFamily: typography.primary,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400, // Maximum width for larger screens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    color: '#002EDC',
    marginBottom: 20,
    textAlign : 'center',
    fontWeight: '900',
    fontFamily: typography.primary,
    textShadowColor: 'rgba(0, 46, 220, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
    fontFamily: typography.primary,
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#0C2340',
    fontSize: 14,
    fontFamily: typography.primary,
  },
  loginButton: {
    backgroundColor: '#002EDC',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: typography.primary,
    textShadowColor: 'rgba(0, 46, 220, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  errorText: {
    color: '#E53935',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: typography.primary,
  },
});