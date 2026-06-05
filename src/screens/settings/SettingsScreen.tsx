import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useAppSelector } from '@store/hooks';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ChatStackParamList, 'Profile'>;

// ─── Section Label ──────────────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => {
  const colors = useThemeColors();
  return <Text style={styles.sectionLabel}>{label}</Text>;
};

// ─── Menu Row ───────────────────────────────────────────────────────────────
interface MenuRowProps {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  isDestructive?: boolean;
}

const MenuRow = React.memo(
  ({ icon, iconColor, iconBg, title, subtitle, onPress, badge, isDestructive }: MenuRowProps) => {
  const colors = useThemeColors();
    return (
      <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuRowIconBox, iconBg ? { backgroundColor: iconBg } : null]}>
          <Icon
            name={icon}
            size={18}
            color={iconColor || (isDestructive ? colors.error : colors.primaryAccent)}
          />
        </View>
        <View style={styles.menuRowText}>
          <Text style={[styles.menuRowTitle, isDestructive && { color: colors.error }]}>{title}</Text>
          <Text style={styles.menuRowSubtitle}>{subtitle}</Text>
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }
);

// ─── Divider ────────────────────────────────────────────────────────────────
const RowDivider = () => {
  const colors = useThemeColors();
  return <View style={styles.menuDivider} />;
};

// ─── Main Screen ────────────────────────────────────────────────────────────
const SettingsScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector(state => state.auth.user);
  const { appLockEnabled, twoFactorEnabled } = useAppSelector(state => state.settings);

  const go = useCallback(
    (screen: keyof ChatStackParamList) => () => {
      navigation.navigate(screen as any);
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBackground} />

      {/* Background Glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs' as any)}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} activeOpacity={0.7}>
          <Icon name="search" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={go('Profile')}
          activeOpacity={0.85}
        >
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user?.avatarUrl}
              name={user?.displayName || 'Alex Chen'}
              size={68}
            />
            <View style={styles.editBadge}>
              <Icon name="pencil" size={10} color={colors.primaryBackground} />
            </View>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.displayName || 'Alex Chen'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email || 'alex.chen@nimbusx.io'}
            </Text>
            <Text style={styles.profileEdit}>Tap to edit profile →</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* ── Account ── */}
        <SectionLabel label="ACCOUNT" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="person-circle-outline"
            iconBg="rgba(99,102,241,0.15)"
            iconColor="#818CF8"
            title="Account"
            subtitle="Profile, number, devices, data"
            onPress={go('AccountSettings')}
          />
          <RowDivider />
          <MenuRow
            icon="phone-portrait-outline"
            iconBg="rgba(59,130,246,0.15)"
            iconColor="#60A5FA"
            title="Change Number"
            subtitle="Migrate account to a new phone number"
            onPress={go('ChangeNumber')}
          />
          <RowDivider />
          <MenuRow
            icon="hardware-chip-outline"
            iconBg="rgba(16,185,129,0.15)"
            iconColor="#34D399"
            title="Linked Devices"
            subtitle="Manage sessions on other devices"
            onPress={go('Devices')}
          />
          <RowDivider />
          <MenuRow
            icon="document-text-outline"
            iconBg="rgba(245,158,11,0.15)"
            iconColor="#FBBF24"
            title="Request Account Info"
            subtitle="Download a report of your data"
            onPress={go('RequestInfo')}
          />
        </View>

        {/* ── Privacy ── */}
        <SectionLabel label="PRIVACY" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="eye-outline"
            iconBg="rgba(6,182,212,0.15)"
            iconColor={colors.primaryAccent}
            title="Privacy"
            subtitle="Last seen, read receipts, profile photo"
            onPress={go('PrivacySettings')}
          />
        </View>

        {/* ── Security ── */}
        <SectionLabel label="SECURITY" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="shield-checkmark-outline"
            iconBg="rgba(16,185,129,0.15)"
            iconColor="#34D399"
            title="Security"
            subtitle="App lock, encryption, 2FA"
            onPress={go('SecuritySettings')}
            badge={appLockEnabled || twoFactorEnabled ? 'Active' : undefined}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionLabel label="NOTIFICATIONS" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="notifications-outline"
            iconBg="rgba(251,146,60,0.15)"
            iconColor="#FB923C"
            title="Notifications"
            subtitle="Message tones, vibration, call ringtone"
            onPress={go('NotificationsSettings')}
          />
        </View>

        {/* ── Chats & Storage ── */}
        <SectionLabel label="CHATS & STORAGE" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="chatbubbles-outline"
            iconBg="rgba(99,102,241,0.15)"
            iconColor="#818CF8"
            title="Chats"
            subtitle="Theme, wallpaper, backup, media visibility"
            onPress={go('ChatsSettings')}
          />
          <RowDivider />
          <MenuRow
            icon="server-outline"
            iconBg="rgba(59,130,246,0.15)"
            iconColor="#60A5FA"
            title="Storage & Data"
            subtitle="Local or cloud sync mode"
            onPress={go('StorageSettings')}
          />
        </View>

        {/* ── Help ── */}
        <SectionLabel label="HELP & LEGAL" />
        <View style={styles.menuCard}>
          <MenuRow
            icon="help-buoy-outline"
            iconBg="rgba(234,179,8,0.15)"
            iconColor="#EAB308"
            title="Help Center"
            subtitle="FAQs and troubleshooting guides"
            onPress={go('HelpCenter')}
          />
          <RowDivider />
          <MenuRow
            icon="mail-outline"
            iconBg="rgba(6,182,212,0.15)"
            iconColor={colors.primaryAccent}
            title="Contact Us"
            subtitle="Send a message to our support team"
            onPress={go('ContactUs')}
          />
          <RowDivider />
          <MenuRow
            icon="document-text-outline"
            iconBg="rgba(148,163,184,0.12)"
            iconColor={colors.textSecondary}
            title="Terms & Privacy Policy"
            subtitle="View our terms of service and policy"
            onPress={go('TermsPrivacy')}
          />
          <RowDivider />
          <MenuRow
            icon="information-circle-outline"
            iconBg="rgba(148,163,184,0.12)"
            iconColor={colors.textSecondary}
            title="App Info"
            subtitle="Version, build info, server status"
            onPress={go('AppInfo')}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>NimbusX · End-to-End Encrypted</Text>
        <Text style={styles.footerVersion}>Version 1.0.0 (Build 84)</Text>
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
    top: -120,
    left: -80,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width,
    backgroundColor: colors.primaryAccent,
    opacity: 0.025,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width,
    backgroundColor: '#818CF8',
    opacity: 0.02,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.m,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerRight: {
    padding: spacing.xs,
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2.5,
  },
  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.l,
    marginBottom: spacing.m,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.l,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryAccent,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondaryBackground,
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profileEdit: {
    fontSize: 12,
    color: colors.primaryAccent,
    fontWeight: '500',
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.9,
    marginBottom: spacing.s,
    marginTop: spacing.m,
    marginLeft: 4,
  },
  // Menu card
  menuCard: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  menuRowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  menuRowText: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuRowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 52,
  },
  // Badge
  badge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  // Footer
  footer: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: 4,
    fontWeight: '500',
  },
  footerVersion: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    opacity: 0.6,
  },
}));

export default SettingsScreen;
