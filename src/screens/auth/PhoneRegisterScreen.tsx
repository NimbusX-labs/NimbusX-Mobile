import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAuth } from '@hooks/useAuth';

const PhoneRegisterScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | null>(null);
  const { sendPhoneOTP, verifyPhoneOTP, loading } = useAuth();
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }
    if (!phone || phone.length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    try {
      const result = await sendPhoneOTP(phone);
      if (result.success) {
        setOtpSent(true);
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
      const result = await verifyPhoneOTP(phone, code);
      if (result.success) {
        (navigation as any).navigate('UsernameSetup', {
        uid: result.uid || '',
        displayName: displayName.trim(),
      });
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code.');
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
          <Text style={styles.title}>Register with Phone</Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? 'Enter the 6-digit code sent to your phone'
              : 'Enter your details to create an account'}
          </Text>

          {!otpSent ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Display Name *</Text>
                <TextInput
                  style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textTertiary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  editable={!loading}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
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
                style={[styles.button, (!displayName || !phone || phone.length < 8) && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={!displayName || !phone || phone.length < 8 || loading}
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
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>

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
                  <Text style={styles.buttonText}>Verify & Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendButton} onPress={handleSendOTP} disabled={loading}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkActionText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  keyboardView: { flex: 1 },
  scrollContent: { padding: spacing.xl, justifyContent: 'center' },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: spacing.m },
  title: {
    fontSize: typography.fontSize.xxlarge, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.medium, color: colors.textSecondary,
    marginBottom: spacing.xxl, textAlign: 'center',
  },
  inputContainer: { marginBottom: spacing.l },
  inputLabel: {
    fontSize: typography.fontSize.tiny, fontWeight: '700', color: colors.textSecondary,
    marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.inputBackground, borderRadius: 10, padding: spacing.m,
    color: colors.textPrimary, fontSize: typography.fontSize.medium,
    borderWidth: 1, borderColor: colors.divider,
  },
  inputFocused: { borderColor: colors.primaryAccent },
  button: {
    backgroundColor: colors.primaryAccent, padding: spacing.m, borderRadius: 10,
    alignItems: 'center', marginTop: spacing.m,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: typography.fontSize.medium, fontWeight: '700' },
  phoneDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.l, gap: spacing.s,
  },
  phoneDisplayText: { fontSize: typography.fontSize.large, fontWeight: '600', color: colors.textPrimary },
  changeText: { fontSize: typography.fontSize.small, color: colors.primaryAccent, fontWeight: '600' },
  otpRow: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.s, marginBottom: spacing.l,
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
  linkButton: { marginTop: spacing.xl, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: typography.fontSize.medium },
  linkActionText: { color: colors.primaryAccent, fontWeight: '600' },
}));

export default PhoneRegisterScreen;
