import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAuth } from '@hooks/useAuth';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen = () => {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | null>(null);
  const { resetPassword, loading } = useAuth();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email Sent',
        'If an account exists with this email, a password reset link has been sent.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error.message || 'An error occurred. Please try again later.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

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

          <TouchableOpacity
            style={[styles.button, !email && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={!email || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryBackground} />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.backRow}>
              <Icon name="arrow-back-outline" size={16} color={colors.primaryAccent} style={styles.backIcon} />
              <Text style={styles.linkText}>Back to Login</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
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
    lineHeight: 22,
    paddingHorizontal: spacing.m,
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
  linkButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: spacing.xs,
  },
  linkText: {
    color: colors.primaryAccent,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
}));

export default ForgotPasswordScreen;
