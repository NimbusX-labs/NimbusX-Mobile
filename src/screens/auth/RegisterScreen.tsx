import React, { useState } from 'react';
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
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAuth } from '@hooks/useAuth';

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen = () => {
  const colors = useThemeColors();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'phone' | null>(null);
  const { register, loading } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password.');
      return;
    }

    try {
      await register(email.trim(), password, displayName.trim());
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Could not create account.',
      );
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name *</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'name' && styles.inputFocused,
              ]}
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
            <Text style={styles.inputLabel}>Email Address *</Text>
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
            <Text style={styles.inputLabel}>Password *</Text>
            <View
              style={[
                styles.passwordRow,
                focusedField === 'password' && styles.passwordRowFocused,
              ]}
            >
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Choose a strong password"
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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number (optional)</Text>
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
            style={[
              styles.button,
              (!email || !password || !displayName) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!email || !password || !displayName || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryBackground} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.phoneRegButton}
            onPress={() => navigation.navigate('PhoneRegister')}
            disabled={loading}
          >
            <Icon name="phone-portrait-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.phoneRegText}>Register with Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.7}
          >
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
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.xxlarge,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.l,
  },
  inputLabel: {
    fontSize: typography.fontSize.tiny,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: spacing.m,
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inputFocused: {
    borderColor: colors.primaryAccent,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingRight: spacing.s,
  },
  passwordRowFocused: {
    borderColor: colors.primaryAccent,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: spacing.s,
  },
  button: {
    backgroundColor: colors.primaryAccent,
    padding: spacing.m,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.m,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.primaryBackground,
    fontSize: typography.fontSize.medium,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: {
    color: colors.textTertiary, paddingHorizontal: spacing.m,
    fontSize: typography.fontSize.tiny, fontWeight: '700', letterSpacing: 1,
  },
  phoneRegButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardBackground, padding: spacing.m, borderRadius: 10,
    borderWidth: 1, borderColor: colors.divider, gap: spacing.s,
  },
  phoneRegText: { color: colors.textPrimary, fontSize: typography.fontSize.medium, fontWeight: '600' },
  linkButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.medium,
  },
  linkActionText: {
    color: colors.primaryAccent,
    fontWeight: '600',
  },
}));

export default RegisterScreen;
