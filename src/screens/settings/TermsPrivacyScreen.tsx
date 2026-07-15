import React, { useState } from 'react';
import {
  View,
  Text,

  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const { width } = Dimensions.get('window');

type TabType = 'terms' | 'privacy';

const TermsPrivacyScreen = () => {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBackground} />

      {/* Decorative Glows */}
      <View style={styles.glowTop} pointerEvents="none" />

      {/* Segmented Switcher Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'terms' && styles.activeTabButton]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'privacy' && styles.activeTabButton]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'terms' ? (
          <View style={styles.contentCard}>
            <Text style={styles.title}>Terms of Service</Text>
            <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

            <Text style={styles.paragraph}>
              Welcome to NimbusX. By downloading, accessing, or using our application, you agree to be bound by these Terms of Service. Please read them carefully.
            </Text>

            <Text style={styles.sectionHeader}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By registering an account and using the NimbusX collaboration application, you acknowledge that you have read, understood, and agreed to these terms. If you do not agree, you must immediately terminate use of the service.
            </Text>

            <Text style={styles.sectionHeader}>2. Safe & Secure Communication</Text>
            <Text style={styles.paragraph}>
              NimbusX is a high-security, end-to-end private messenger and collaboration suite. We do not inspect, intercept, or access the contents of your messages. You are solely responsible for keeping your secure access credentials, passwords, and private backup keys safe.
            </Text>

            <Text style={styles.sectionHeader}>3. Data Storage & Ownership</Text>
            <Text style={styles.paragraph}>
              You retain all ownership rights to the files and messages you transmit through NimbusX. We support two storage operations:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Local Only Mode:</Text> All communication is held strictly on your device's local database and is not synced to NimbusX cloud nodes.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Cloud Sync Mode:</Text> Your encrypted communication is securely mirrored on cloud databases solely to facilitate seamless cross-device retrieval.
              </Text>
            </View>

            <Text style={styles.sectionHeader}>4. User Code of Conduct</Text>
            <Text style={styles.paragraph}>
              You agree to use NimbusX responsibly and legally. You shall not:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Use the app for illegal activities, spam, or distribution of unauthorized files.</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Attempt to disrupt the integrity, encryption standard, or server performance of NimbusX.</Text>
            </View>

            <Text style={styles.sectionHeader5}>5. Disclaimer & Liability Limitations</Text>
            <Text style={styles.paragraph}>
              The NimbusX service is provided "as is" and "as available". We do not guarantee continuous, error-free operation. To the maximum extent permitted by law, NimbusX and its developers are not liable for direct, indirect, accidental, or consequential data losses or damages.
            </Text>

            <Text style={styles.sectionHeader}>6. Modifications to Service</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify, suspend, or enhance any feature of the application at any time to preserve safety and update the product. Continued use represents your acceptance of updated terms.
            </Text>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

            <Text style={styles.paragraph}>
              At NimbusX, we are fully committed to protecting your privacy and secure communication. This Privacy Policy details what minimal information we collect, how it is managed, and your comprehensive data rights.
            </Text>

            <Text style={styles.sectionHeader}>1. Minimal Data Collection</Text>
            <Text style={styles.paragraph}>
              To operate a functional collaborative environment, we only store:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Account Credentials:</Text> Your email address, authenticated display name, and optional avatar picture are registered to configure your user profile.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Encrypted Messages & Files:</Text> All synced contents are processed securely. Chat text and document blobs are stored dynamically in cloud instances only if Cloud Sync is active.
              </Text>
            </View>

            <Text style={styles.sectionHeader}>2. Information Protection Standards</Text>
            <Text style={styles.paragraph}>
              We implement advanced server-level security protocols. When Cloud Sync is selected:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>All connections utilize secure SSL/TLS communication protocols.</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Database tables use Supabase Row-Level Security (RLS) to enforce that only verified participants of a chat room can query its files or messages.</Text>
            </View>

            <Text style={styles.sectionHeader}>3. We Do Not Sell Your Data</Text>
            <Text style={styles.paragraph}>
              NimbusX is completely clean and independent. We have zero ad tracking, zero telemetry logging, and we never share, sell, distribute, or lease your account information or message details to third-party marketing companies.
            </Text>

            <Text style={styles.sectionHeader}>4. User Autonomy & Deletion Rights</Text>
            <Text style={styles.paragraph}>
              You have complete control over your user records:
            </Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Purge PERSIST Storage:</Text> Logging out automatically purges all active messages, contacts, and offline databases stored on the local device.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Account Deletion:</Text> You can request absolute deletion of your cloud-stored profiles and message references at any time under Account settings.
              </Text>
            </View>

            <Text style={styles.sectionHeader}>5. Changes to this Policy</Text>
            <Text style={styles.paragraph}>
              We may periodically update this policy to reflect platform updates or statutory requirements. We will notify active users of any significant modifications.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: colors.primaryAccent,
    opacity: 0.02,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryBackground,
    marginHorizontal: spacing.l,
    marginTop: spacing.l,
    borderRadius: 12,
    padding: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.m,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabButton: {
    backgroundColor: colors.primaryBackground,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  activeTabText: {
    color: colors.primaryAccent,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  contentCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: spacing.l,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  sectionHeader5: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.m,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: spacing.s,
    marginBottom: spacing.s,
  },
  bullet: {
    fontSize: 14,
    color: colors.primaryAccent,
    marginRight: spacing.s,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
}));

export default TermsPrivacyScreen;
