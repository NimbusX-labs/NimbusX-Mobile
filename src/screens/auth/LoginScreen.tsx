import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAuth } from '@hooks/useAuth';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

type AuthMode = 'email' | 'phone';

const LoginScreen = () => {
  const colors = useThemeColors();
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'phone' | null>(null);
  const { login, loginWithGoogle, sendPhoneOTP, verifyPhoneOTP, loading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Check your credentials and try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error?.message?.includes('SIGN_IN_CANCELLED') || error?.code === 'SIGN_IN_CANCELLED') return;
      Alert.alert('Google Sign-In Failed', error.message || 'An error occurred during Google Sign-In.');
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    try {
      const result = await sendPhoneOTP(phone);
      if (result.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'A verification code has been sent to your phone.');
      }
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Could not send OTP.');
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code.');
      return;
    }
    try {
      await verifyPhoneOTP(phone, code);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code. Please try again.');
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your conversations.</Text>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, authMode === 'email' && styles.modeButtonActive]}
              onPress={() => switchMode('email')}
            >
              <Icon
                name="mail-outline"
                size={16}
                color={authMode === 'email' ? colors.primaryAccent : colors.textSecondary}
              />
              <Text style={[styles.modeText, authMode === 'email' && styles.modeTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, authMode === 'phone' && styles.modeButtonActive]}
              onPress={() => switchMode('phone')}
            >
              <Icon
                name="phone-portrait-outline"
                size={16}
                color={authMode === 'phone' ? colors.primaryAccent : colors.textSecondary}
              />
              <Text style={[styles.modeText, authMode === 'phone' && styles.modeTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'email' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View
                  style={[
                    styles.passwordRow,
                    focusedField === 'password' && styles.passwordRowFocused,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, (!email || !password) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!email || !password || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryBackground} />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, loading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <>
                    <Icon name="logo-google" size={18} color={colors.textPrimary} style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!otpSent ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'phone' && styles.inputFocused,
                      ]}
                      placeholder="+1 234 567 8900"
                      placeholderTextColor={colors.textTertiary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      editable={!loading}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.button, (!phone || phone.length < 8) && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={!phone || phone.length < 8 || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.primaryBackground} />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.phoneDisplay}>
                    <Icon name="phone-portrait-outline" size={18} color={colors.primaryAccent} />
                    <Text style={styles.phoneDisplayText}>{phone}</Text>
                    <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); }}>
                      <Text style={styles.changePhoneText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.otpLabel}>Enter the 6-digit code sent to your phone</Text>

                  <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, otp.join('').length !== 6 && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={otp.join('').length !== 6 || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.primaryBackground} />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Sign In</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {authMode === 'email' && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkActionText}>Register</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  keyboardView: { flex: 1 },
  scrollContent: { padding: spacing.xl, justifyContent: 'center' },
  logo: {
    width: 80, height: 80, alignSelf: 'center', marginBottom: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.xxlarge, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.medium, color: colors.textSecondary,
    marginBottom: spacing.xxl, textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row', marginBottom: spacing.xxl,
    backgroundColor: colors.secondaryBackground, borderRadius: 10,
    borderWidth: 0.5, borderColor: colors.divider, padding: 3,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.s, borderRadius: 8, gap: spacing.xs,
  },
  modeButtonActive: { backgroundColor: colors.primaryAccent + '20' },
  modeText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modeTextActive: { color: colors.primaryAccent },
  inputContainer: { marginBottom: spacing.l },
  inputLabel: {
    fontSize: typography.fontSize.tiny, fontWeight: '700',
    color: colors.textSecondary, marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.inputBackground, borderRadius: 10,
    padding: spacing.m, color: colors.textPrimary,
    fontSize: typography.fontSize.medium, borderWidth: 1, borderColor: colors.divider,
  },
  inputFocused: { borderColor: colors.primaryAccent },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: colors.divider, paddingRight: spacing.s,
  },
  passwordRowFocused: { borderColor: colors.primaryAccent },
  passwordInput: { flex: 1, borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent' },
  eyeButton: { padding: spacing.s },
  button: {
    backgroundColor: colors.primaryAccent, padding: spacing.m,
    borderRadius: 10, alignItems: 'center', marginTop: spacing.m,
    shadowColor: colors.primaryAccent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.primaryBackground, fontSize: typography.fontSize.medium, fontWeight: '700' },
  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: {
    color: colors.textTertiary, paddingHorizontal: spacing.m,
    fontSize: typography.fontSize.tiny, fontWeight: '700', letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardBackground, padding: spacing.m, borderRadius: 10,
    borderWidth: 1, borderColor: colors.divider,
  },
  googleIcon: { marginRight: spacing.s },
  googleButtonText: { color: colors.textPrimary, fontSize: typography.fontSize.medium, fontWeight: '600' },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: spacing.l },
  forgotPasswordText: { color: colors.primaryAccent, fontSize: typography.fontSize.small, fontWeight: '600' },
  linkButton: { marginTop: spacing.xl, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: typography.fontSize.medium },
  linkActionText: { color: colors.primaryAccent, fontWeight: '600' },
  phoneDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.l, gap: spacing.s,
  },
  phoneDisplayText: { fontSize: typography.fontSize.large, fontWeight: '600', color: colors.textPrimary },
  changePhoneText: { fontSize: typography.fontSize.small, color: colors.primaryAccent, fontWeight: '600' },
  otpLabel: {
    fontSize: typography.fontSize.small, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.l,
  },
  otpRow: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.s,
    marginBottom: spacing.l,
  },
  otpBox: {
    width: 44, height: 52, borderRadius: 10, borderWidth: 1.5,
    borderColor: colors.divider, backgroundColor: colors.inputBackground,
    color: colors.textPrimary, fontSize: typography.fontSize.xlarge,
    fontWeight: '700', textAlign: 'center',
  },
  otpBoxFilled: { borderColor: colors.primaryAccent },
  resendButton: { alignItems: 'center', marginTop: spacing.m },
  resendText: { color: colors.primaryAccent, fontSize: typography.fontSize.small, fontWeight: '600' },
}));

export default LoginScreen;
