import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUser } from '@store/slices/authSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const ChangeNumberScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    const trimmedNum = phoneNumber.trim();
    if (!trimmedNum || trimmedNum.length < 6 || isNaN(Number(trimmedNum))) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      Alert.alert(
        'Simulated SMS Code Sent',
        'Verification OTP code dispatched! For testing, use OTP code: 777777'
      );
    }, 1200);
  };

  const handleVerify = () => {
    if (otp !== '777777') {
      Alert.alert('Invalid Code', 'Please enter the correct 6-digit verification code: 777777');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (user) {
        // Update user record with phone number
        const updatedUser = {
          ...user,
          phoneNumber: `${countryCode} ${phoneNumber.trim()}`,
        };
        dispatch(setUser(updatedUser));
      }

      Alert.alert(
        'Success',
        `Your NimbusX account has been successfully migrated to: ${countryCode} ${phoneNumber.trim()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setStep(1);
              setPhoneNumber('');
              setOtp('');
            },
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {[1, 2].map((s) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  {step > s ? (
                    <Icon name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <Text style={[styles.stepNum, step === s && styles.stepNumActive]}>{s}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                  {s === 1 ? 'New Number' : 'Verify'}
                </Text>
              </View>
            ))}
            <View style={styles.stepConnector} />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Icon name="information-circle-outline" size={20} color={colors.primaryAccent} />
            <Text style={styles.infoText}>
              {step === 1
                ? 'Your account data, groups, and contacts will be migrated to the new number. Your contacts will be notified of the change.'
                : `A 6-digit verification code has been sent to ${countryCode} ${phoneNumber}. Enter it below to confirm.`}
            </Text>
          </View>

          {step === 1 ? (
            /* Step 1 — Enter New Number */
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Enter New Number</Text>
              <Text style={styles.formSubtitle}>
                This will replace your current registered phone number.
              </Text>

              <Text style={styles.fieldLabel}>Country Code</Text>
              <TextInput
                style={styles.input}
                value={countryCode}
                onChangeText={setCountryCode}
                placeholder="+1"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={[styles.fieldLabel, { marginTop: spacing.m }]}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabled]}
                onPress={handleContinue}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                    <Icon name="arrow-forward" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2 — Enter OTP */
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Verify Your Number</Text>
              <Text style={styles.formSubtitle}>
                Enter the code sent to {countryCode} {phoneNumber}
              </Text>

              <Text style={styles.fieldLabel}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Confirm Change</Text>
                    <Icon name="checkmark-circle-outline" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Use a different number</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.warningCard}>
            <Icon name="warning-outline" size={18} color={colors.warning} />
            <Text style={styles.warningText}>
              Make sure you have access to the new number before proceeding. This action cannot be undone without further verification.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 1,
    marginHorizontal: spacing.xl,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  stepCircleActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(6,182,212,0.15)',
  },
  stepNum: { fontSize: 14, fontWeight: '700', color: colors.textTertiary },
  stepNumActive: { color: colors.primaryAccent },
  stepLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },
  stepLabelActive: { color: colors.primaryAccent },
  stepConnector: {
    position: 'absolute',
    top: 18,
    left: '30%',
    right: '30%',
    height: 1,
    backgroundColor: colors.divider,
    zIndex: 0,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.s,
  },
  formCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.l,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  primaryButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginTop: spacing.l,
    minHeight: 48,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  backLinkText: {
    color: colors.primaryAccent,
    fontSize: 14,
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    padding: spacing.l,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 19,
    marginLeft: spacing.s,
  },
  disabled: {
    opacity: 0.7,
  },
}));

export default ChangeNumberScreen;
