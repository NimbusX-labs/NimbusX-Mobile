import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const faqs = [
  {
    question: 'How does Cloud Sync work?',
    answer:
      'When Cloud Sync is enabled, your messages and files are securely mirrored to our servers using SSL/TLS encryption. This lets you pick up right where you left off on any device. Your data is protected by Supabase Row-Level Security, ensuring only you can access your content.',
  },
  {
    question: 'Is my chat content secure?',
    answer:
      'Absolutely. NimbusX enforces strict end-to-end privacy. Message contents are stored in encrypted database tables protected by Row-Level Security policies — only verified participants of a conversation can query their data. We never read, inspect, or sell your content.',
  },
  {
    question: 'How do I delete my local database?',
    answer:
      'Simply log out of your account. NimbusX automatically purges all locally persisted data — messages, contacts, and offline files — from your device when you sign out. You can also delete your account under Account settings for full server-side removal.',
  },
  {
    question: 'How do I manage my active sessions?',
    answer:
      'Go to Settings → Account → Devices to view all currently logged-in sessions. You can individually terminate any session or use the "Terminate All Other Sessions" button to sign out everywhere except your current device.',
  },
  {
    question: 'Can I use NimbusX without internet?',
    answer:
      'Yes! If you have Local Only mode selected, all your data lives on your device and no internet connection is required to browse your message history. However, sending and receiving new messages requires a live connection.',
  },
  {
    question: 'How do I change my profile picture?',
    answer:
      'Tap your avatar in the Settings page or go to Settings → Account → Profile. From there, tap the avatar area to open your device\'s image picker and select a new photo. Tap Save Profile to apply the changes.',
  },
];

const FaqCard = ({ question, answer }: { question: string; answer: string }) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  return (
    <TouchableOpacity style={styles.faqCard} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.primaryAccent}
        />
      </View>
      {expanded && (
        <View style={styles.faqBody}>
          <View style={styles.faqDivider} />
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HelpCenterScreen = () => {
  const colors = useThemeColors();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconCircle}>
            <Icon name="help-buoy-outline" size={32} color={colors.primaryAccent} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to the most common questions about NimbusX.
          </Text>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        {faqs.map((faq, index) => (
          <FaqCard key={index} question={faq.question} answer={faq.answer} />
        ))}

        <Text style={styles.footerNote}>
          Still need help? Head to{' '}
          <Text style={styles.footerLink}>Contact Us</Text>.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  heroBanner: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.m,
  },
  faqCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.m,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.m,
  },
  faqBody: {
    marginTop: spacing.m,
  },
  faqDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginBottom: spacing.m,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footerNote: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  footerLink: {
    color: colors.primaryAccent,
    fontWeight: '600',
  },
}));

export default HelpCenterScreen;
