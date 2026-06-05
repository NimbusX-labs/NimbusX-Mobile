import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setAppLock,
  toggleSecurityNotifications,
  setTwoFactor,
} from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

const { width, height } = Dimensions.get('window');

const SecuritySettingsScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { appLockEnabled, appLockPin, securityNotifications, twoFactorEnabled, twoFactorSecret } = useAppSelector(
    (state) => state.settings
  );

  // States for PIN Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<1 | 2>(1);

  // States for 2FA Wizard Modal
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<1 | 2 | 3>(1);
  const [authCode, setAuthCode] = useState('');
  const [recoveryCodeSaved, setRecoveryCodeSaved] = useState(false);

  const encryptionParams = [
    { label: 'Encryption Standard', value: 'AES-256-GCM' },
    { label: 'Protocol', value: 'SSL / TLS 1.3' },
    { label: 'Key Exchange', value: 'ECDH (P-256)' },
    { label: 'Authentication', value: 'JWT + Supabase Auth' },
    { label: 'DB Security', value: 'Row-Level Security (RLS)' },
  ];

  // App Lock logic
  const handleAppLockToggle = (val: boolean) => {
    if (val) {
      // Open PIN setup modal
      setPinStep(1);
      setPin('');
      setConfirmPin('');
      setPinModalVisible(true);
    } else {
      // Direct disable or ask for PIN
      if (appLockPin) {
        Alert.alert(
          'Disable App Lock',
          'Are you sure you want to disable biometric/PIN protection?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: () => dispatch(setAppLock({ enabled: false, pin: null })),
            },
          ]
        );
      } else {
        dispatch(setAppLock({ enabled: false, pin: null }));
      }
    }
  };

  const handleSavePin = () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }
    setPinStep(2);
  };

  const handleConfirmPin = () => {
    if (confirmPin !== pin) {
      Alert.alert('Mismatch', 'PINs do not match. Please try again.');
      setPinStep(1);
      setPin('');
      setConfirmPin('');
      return;
    }
    dispatch(setAppLock({ enabled: true, pin }));
    setPinModalVisible(false);
    Alert.alert('App Lock Activated', 'PIN code setup successfully!');
  };

  // 2FA logic
  const handleTwoFactorToggle = (val: boolean) => {
    if (val) {
      setTwoFactorStep(1);
      setAuthCode('');
      setRecoveryCodeSaved(false);
      setTwoFactorModalVisible(true);
    } else {
      Alert.alert(
        'Disable 2FA',
        'Disabling two-factor authentication will lower your account security.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => dispatch(setTwoFactor({ enabled: false, secret: null })),
          },
        ]
      );
    }
  };

  const handleVerify2FACode = () => {
    if (authCode.length < 6) {
      Alert.alert('Verification Failed', 'Verification code must be exactly 6 digits.');
      return;
    }
    // Set simulated Secret Key and move to step 3 (backup/recovery codes)
    setTwoFactorStep(3);
  };

  const handleComplete2FA = () => {
    if (!recoveryCodeSaved) {
      Alert.alert('Save Recovery Code', 'Please copy/save your recovery code before finishing.');
      return;
    }
    dispatch(setTwoFactor({ enabled: true, secret: 'NIMBUSX-MOCK-SECRET-KEY-2026' }));
    setTwoFactorModalVisible(false);
    Alert.alert('2FA Enabled', 'Two-Factor Authentication is now active on your account.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Security Status Hero */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconCircle}>
            <Icon name="shield-checkmark" size={36} color={colors.success} />
          </View>
          <Text style={styles.heroTitle}>Encrypted & Shielded</Text>
          <Text style={styles.heroSubtitle}>
            Your account and communications are protected by industry-standard security protocols.
          </Text>
          <View style={styles.heroBadge}>
            <Icon name="lock-closed" size={12} color={colors.success} />
            <Text style={styles.heroBadgeText}>All connections are secure</Text>
          </View>
        </View>

        {/* Encryption Details */}
        <Text style={styles.sectionLabel}>ENCRYPTION PARAMETERS</Text>
        <View style={styles.card}>
          {encryptionParams.map((param, i) => (
            <View key={param.label}>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>{param.label}</Text>
                <Text style={styles.paramValue}>{param.value}</Text>
              </View>
              {i < encryptionParams.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Security Controls */}
        <Text style={styles.sectionLabel}>SECURITY CONTROLS</Text>
        <View style={styles.card}>
          {/* App Lock Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Icon name="finger-print-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>App Lock</Text>
                <Text style={styles.rowSubtitle}>
                  {appLockEnabled ? 'PIN Lock Enabled' : 'Require PIN to open NimbusX'}
                </Text>
              </View>
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={handleAppLockToggle}
              thumbColor={colors.white}
              trackColor={{ true: colors.primaryAccent, false: colors.divider }}
            />
          </View>
          <View style={styles.divider} />

          {/* Security Notifications Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Icon name="notifications-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Security Notifications</Text>
                <Text style={styles.rowSubtitle}>Alert when a contact's security code changes</Text>
              </View>
            </View>
            <Switch
              value={securityNotifications}
              onValueChange={() => {
                dispatch(toggleSecurityNotifications());
              }}
              thumbColor={colors.white}
              trackColor={{ true: colors.primaryAccent, false: colors.divider }}
            />
          </View>
          <View style={styles.divider} />

          {/* 2FA Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Icon name="key-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Two-Factor Authentication</Text>
                <Text style={styles.rowSubtitle}>
                  {twoFactorEnabled ? '2FA Enabled' : 'Add a second layer of sign-in verification'}
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleTwoFactorToggle}
              thumbColor={colors.white}
              trackColor={{ true: colors.primaryAccent, false: colors.divider }}
            />
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={20} color={colors.primaryAccent} />
          <Text style={styles.infoText}>
            NimbusX uses Supabase's secure backend infrastructure. Database records are protected by Row-Level Security policies, ensuring only authenticated users can access their own data.
          </Text>
        </View>
      </ScrollView>

      {/* 1. App Lock Setup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set App Lock PIN</Text>
              <TouchableOpacity onPress={() => setPinModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {pinStep === 1 ? (
              <View style={styles.pinForm}>
                <Icon name="lock-open-outline" size={48} color={colors.primaryAccent} style={styles.pinIcon} />
                <Text style={styles.pinLabel}>Enter a 4-digit PIN</Text>
                <TextInput
                  style={styles.pinInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={pin}
                  onChangeText={setPin}
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleSavePin}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pinForm}>
                <Icon name="checkmark-shield-outline" size={48} color={colors.success} style={styles.pinIcon} />
                <Text style={styles.pinLabel}>Confirm your 4-digit PIN</Text>
                <TextInput
                  style={styles.pinInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={handleConfirmPin}>
                  <Text style={styles.primaryButtonText}>Activate App Lock</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Two-Factor Authentication Setup Wizard */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={twoFactorModalVisible}
        onRequestClose={() => setTwoFactorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Two-Factor Setup</Text>
              <TouchableOpacity onPress={() => setTwoFactorModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {twoFactorStep === 1 && (
              <ScrollView contentContainerStyle={styles.wizardContent}>
                <View style={styles.qrPlaceholder}>
                  <Icon name="qr-code-outline" size={96} color={colors.primaryAccent} />
                  <Text style={styles.qrText}>Simulated Authenticator QR Code</Text>
                </View>
                <Text style={styles.wizardInstruction}>
                  Scan the QR code with your authenticator app (e.g. Google Authenticator or Duo).
                </Text>
                <View style={styles.keyBox}>
                  <Text style={styles.keyLabel}>Manual Setup Key:</Text>
                  <Text style={styles.keyValue}>NIMB-USXC-2026-SECR-ETKE-YMOD</Text>
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setTwoFactorStep(2)}>
                  <Text style={styles.primaryButtonText}>Next: Verify Code</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {twoFactorStep === 2 && (
              <View style={styles.wizardContent}>
                <Icon name="phone-portrait-outline" size={48} color={colors.primaryAccent} style={styles.pinIcon} />
                <Text style={styles.wizardInstruction}>
                  Enter the 6-digit verification code generated by your authenticator app.
                </Text>
                <TextInput
                  style={[styles.pinInput, { width: 220, fontSize: 24, letterSpacing: 8 }]}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={authCode}
                  onChangeText={setAuthCode}
                  placeholder="••••••"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerify2FACode}>
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {twoFactorStep === 3 && (
              <ScrollView contentContainerStyle={styles.wizardContent}>
                <Icon name="checkbox-outline" size={48} color={colors.success} style={styles.pinIcon} />
                <Text style={styles.wizardTitle}>Backup Recovery Key</Text>
                <Text style={styles.wizardInstruction}>
                  If you lose your phone, you can use this recovery key to sign into your NimbusX account. Write it down and keep it in a safe place.
                </Text>
                <View style={[styles.keyBox, { borderColor: colors.success }]}>
                  <Text style={[styles.keyValue, { color: colors.success, fontSize: 16 }]}>
                    RECO-VERY-CODE-2026-NIMB-USX8
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.saveRecoveryBtn, recoveryCodeSaved && styles.saveRecoveryBtnActive]}
                  onPress={() => setRecoveryCodeSaved(true)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={recoveryCodeSaved ? 'checkmark-circle' : 'copy-outline'}
                    size={16}
                    color={recoveryCodeSaved ? colors.success : colors.primaryAccent}
                  />
                  <Text style={[styles.saveRecoveryText, recoveryCodeSaved && { color: colors.success }]}>
                    {recoveryCodeSaved ? 'Recovery Key Copied!' : 'Copy Recovery Key'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, !recoveryCodeSaved && styles.disabledBtn]}
                  onPress={handleComplete2FA}
                  disabled={!recoveryCodeSaved}
                >
                  <Text style={styles.primaryButtonText}>Complete Setup</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  heroBanner: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.m,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    gap: spacing.xxs,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.xxs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.s,
    overflow: 'hidden',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  paramLabel: { fontSize: 14, color: colors.textSecondary },
  paramValue: { fontSize: 13, fontWeight: '700', color: colors.primaryAccent },
  divider: { height: 0.5, backgroundColor: colors.divider },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.m,
  },
  rowIcon: { marginRight: spacing.m, width: 24, textAlign: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    padding: spacing.l,
    marginTop: spacing.m,
    gap: spacing.s,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 19,
    marginLeft: spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.primaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl * 2 : spacing.xl,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  pinForm: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pinIcon: {
    marginBottom: spacing.m,
  },
  pinLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.m,
  },
  pinInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: 12,
    width: 160,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    paddingVertical: spacing.s,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  wizardContent: {
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  qrText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  wizardInstruction: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  wizardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  keyBox: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.m,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  keyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  keyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryAccent,
    letterSpacing: 0.5,
  },
  saveRecoveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.xl,
  },
  saveRecoveryBtnActive: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  saveRecoveryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  disabledBtn: {
    opacity: 0.4,
  },
}));

export default SecuritySettingsScreen;
