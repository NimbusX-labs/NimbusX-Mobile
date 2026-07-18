import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useIdentity } from '@hooks/useIdentity';

const UsernameSetupScreen = ({ route }: any) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const params = route?.params || {};
  const uid = params.uid || '';

  const [username, setUsername] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { validateUsername, isUsernameAvailable, getUsernameSuggestions, setUsername: setUserUsername } = useIdentity();

  useEffect(() => {
    if (username.length >= 2) {
      const validation = validateUsername(username);
      setValidationError(validation.valid ? null : validation.error || null);
    } else {
      setValidationError(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [username, validateUsername]);

  const handleCheck = async () => {
    const normalized = username.toLowerCase().trim();
    if (!normalized || normalized.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }
    setChecking(true);
    try {
      const available = await isUsernameAvailable(normalized);
      if (available) {
        setValidationError(null);
        Alert.alert('Available', `@${normalized} is available!`);
      } else {
        setValidationError('This username is taken');
        const suggestionsList = await getUsernameSuggestions(normalized);
        setSuggestions(suggestionsList);
        setShowSuggestions(true);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Failed to check username');
    } finally {
      setChecking(false);
    }
  };

  const handleSetUsername = async () => {
    const normalized = username.toLowerCase().trim();
    if (!normalized) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }
    const validation = validateUsername(normalized);
    if (!validation.valid) {
      Alert.alert('Error', validation.error);
      return;
    }
    setLoading(true);
    try {
      await setUserUsername(uid, normalized);
      Alert.alert('Success', `Your Nimbus ID is @${normalized}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to set username');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const isValid = username.length >= 3 && !validationError;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Icon name="at-outline" size={48} color={colors.primaryAccent} />
          <Text style={styles.title}>Choose your Nimbus ID</Text>
          <Text style={styles.subtitle}>
            This is your unique username. People can find you with @username.
          </Text>
        </View>

        {/* Username Input */}
        <View style={styles.inputCard}>
          <View style={[styles.inputRow, validationError ? styles.inputError : null]}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {checking ? (
              <ActivityIndicator size="small" color={colors.primaryAccent} />
            ) : username.length >= 3 && !validationError ? (
              <Icon name="checkmark-circle" size={20} color="#22c55e" />
            ) : null}
          </View>
          {validationError ? (
            <Text style={styles.errorText}>{validationError}</Text>
          ) : null}
          <Text style={styles.hint}>3-30 characters, lowercase, numbers and underscores</Text>
        </View>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 ? (
          <View style={styles.suggestionsCard}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(s)}
                activeOpacity={0.7}
              >
                <Icon name="at-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.suggestionText}>@{s}</Text>
                <Icon name="chevron-forward" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleSetUsername}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.buttonText}>Set Username</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheck}
          disabled={username.length < 3 || checking}
        >
          <Text style={styles.checkText}>Check Availability</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can always set your Nimbus ID later in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  scrollContent: { padding: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: {
    fontSize: typography.fontSize.xlarge, fontWeight: '700',
    color: colors.textPrimary, marginTop: spacing.m, textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.medium, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.s, lineHeight: 20,
  },
  inputCard: {
    backgroundColor: colors.secondaryBackground, borderRadius: 14,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.l,
    marginBottom: spacing.l,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBackground, borderRadius: 10,
    borderWidth: 1, borderColor: colors.divider, paddingHorizontal: spacing.m,
    gap: spacing.xs,
  },
  inputError: { borderColor: colors.error },
  atSymbol: { fontSize: typography.fontSize.xlarge, color: colors.textSecondary, fontWeight: '700' },
  input: {
    flex: 1, color: colors.textPrimary, fontSize: typography.fontSize.xlarge,
    fontWeight: '700', paddingVertical: spacing.m,
  },
  errorText: {
    fontSize: typography.fontSize.tiny, color: colors.error,
    marginTop: spacing.xs, fontWeight: '500',
  },
  hint: {
    fontSize: typography.fontSize.tiny, color: colors.textTertiary,
    marginTop: spacing.s,
  },
  suggestionsCard: {
    backgroundColor: colors.secondaryBackground, borderRadius: 14,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.l,
    marginBottom: spacing.l,
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.small, fontWeight: '700',
    color: colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: spacing.s,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s,
    gap: spacing.s,
  },
  suggestionText: { flex: 1, fontSize: typography.fontSize.regular, color: colors.textPrimary, fontWeight: '500' },
  button: {
    backgroundColor: colors.primaryAccent, padding: spacing.m,
    borderRadius: 10, alignItems: 'center', marginTop: spacing.m,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: typography.fontSize.medium, fontWeight: '700' },
  checkButton: { alignItems: 'center', marginTop: spacing.m },
  checkText: { color: colors.primaryAccent, fontSize: typography.fontSize.regular, fontWeight: '600' },
  skipButton: { alignItems: 'center', marginTop: spacing.xl },
  skipText: { color: colors.textSecondary, fontSize: typography.fontSize.regular },
  footerText: {
    fontSize: typography.fontSize.tiny, color: colors.textTertiary,
    textAlign: 'center', marginTop: spacing.m,
  },
}));

export default UsernameSetupScreen;
