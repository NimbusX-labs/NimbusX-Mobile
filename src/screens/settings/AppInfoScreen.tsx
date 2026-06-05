import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '42';
const RELEASE_DATE = 'May 2026';

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  const colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const AppInfoScreen = () => {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Icon name="shield-checkmark" size={44} color={colors.primaryAccent} />
          </View>
          <Text style={styles.appName}>NimbusX</Text>
          <Text style={styles.tagline}>Private. Secure. Yours.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* Build Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Build Information</Text>
          <InfoRow label="Version" value={APP_VERSION} />
          <View style={styles.rowDivider} />
          <InfoRow label="Build Number" value={BUILD_NUMBER} />
          <View style={styles.rowDivider} />
          <InfoRow label="Release Date" value={RELEASE_DATE} />
          <View style={styles.rowDivider} />
          <InfoRow label="Platform" value="React Native 0.84.0" />
          <View style={styles.rowDivider} />
          <InfoRow label="Min SDK" value="Android 8.0 / iOS 14.0+" />
        </View>

        {/* Server Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Icon name="cloud-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statusLabel}>Cloud Servers</Text>
            </View>
            <View style={styles.statusRight}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.statusOperational}>Operational</Text>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Icon name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statusLabel}>Authentication</Text>
            </View>
            <View style={styles.statusRight}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.statusOperational}>Operational</Text>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Icon name="server-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statusLabel}>Database</Text>
            </View>
            <View style={styles.statusRight}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.statusOperational}>Operational</Text>
            </View>
          </View>
        </View>

        {/* Technology Stack Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Powered By</Text>
          {[
            { name: 'React Native', desc: 'Cross-platform UI framework' },
            { name: 'Supabase', desc: 'Auth, database & storage backend' },
            { name: 'Redux Toolkit', desc: 'State management' },
            { name: 'React Navigation', desc: 'In-app navigation' },
          ].map((tech, i, arr) => (
            <View key={tech.name}>
              <View style={styles.techRow}>
                <Text style={styles.techName}>{tech.name}</Text>
                <Text style={styles.techDesc}>{tech.desc}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} NimbusX. All rights reserved.{'\n'}
          Made with ❤️ for private, secure communication.
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(6,182,212,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.m,
  },
  versionBadge: {
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.s,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.s,
  },
  statusOperational: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  techRow: {
    paddingVertical: spacing.s,
  },
  techName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  techDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  copyright: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
}));

export default AppInfoScreen;
