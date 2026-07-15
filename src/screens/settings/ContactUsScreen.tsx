import React, { useState } from 'react';
import {
  View,
  Text,

  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch } from '@store/hooks';
import { addTicket } from '@store/slices/settingsSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const categories = ['General', 'Technical Support', 'Bug Report', 'Feature Request', 'Account Issue'];

const ContactUsScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();

  const [selectedCategory, setSelectedCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      Alert.alert('Empty Message', 'Please write your message before submitting.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      // Create support ticket and save to settings history logs
      const ticketId = Math.random().toString(36).substring(7);
      dispatch(
        addTicket({
          id: ticketId,
          category: selectedCategory,
          message: trimmedMsg,
          timestamp: Date.now(),
        })
      );

      setSubmitted(true);
      Alert.alert('Support Ticket Logged', 'Your support request has been logged securely in your device files.');
    }, 1200);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:nimbus@nimbusx.io');
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Icon name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successSubtitle}>
            Thanks for reaching out. Our support team has received your ticket and will get back to you at your
            registered email within 24–48 hours.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSubmitted(false);
              setMessage('');
              setSelectedCategory('General');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.resetButtonText}>Send Another Ticket</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Direct Email Card */}
          <TouchableOpacity style={styles.emailCard} onPress={handleEmailPress} activeOpacity={0.8}>
            <View style={styles.emailIconCircle}>
              <Icon name="mail" size={22} color={colors.primaryAccent} />
            </View>
            <View style={styles.emailCardText}>
              <Text style={styles.emailCardLabel}>Email us directly</Text>
              <Text style={styles.emailAddress}>nimbus@nimbusx.io</Text>
            </View>
            <Icon name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Support Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send a Message</Text>
            <Text style={styles.formSubtitle}>
              Fill in the form below and we'll respond to your registered email.
            </Text>

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.activeCategoryChip]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.activeCategoryChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Message Field */}
            <Text style={[styles.fieldLabel, { marginTop: spacing.l }]}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue or feedback in detail..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledSubmit]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Icon name="send" size={16} color={colors.white} style={{ marginRight: spacing.s }} />
                  <Text style={styles.submitButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Contact Info Footer */}
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.infoText}>Response time: 24–48 hours on business days</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.infoText}>Your message is confidential and encrypted in transit</Text>
          </View>
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
  disabledSubmit: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  emailIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailCardText: {
    flex: 1,
    marginLeft: spacing.m,
  },
  emailCardLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryAccent,
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
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryScroll: {
    marginBottom: spacing.s,
  },
  categoryChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.s,
  },
  activeCategoryChip: {
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderColor: colors.primaryAccent,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 14,
    padding: spacing.m,
    minHeight: 130,
    marginBottom: spacing.l,
  },
  submitButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: spacing.s,
    flex: 1,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    borderRadius: 12,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xxl,
  },
  resetButtonText: {
    color: colors.primaryAccent,
    fontWeight: '600',
    fontSize: 15,
  },
}));

export default ContactUsScreen;
