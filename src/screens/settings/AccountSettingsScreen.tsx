import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { authService } from '@services/supabase/auth';
import { persistor } from '@store/index';
import { supabase } from '../../config/supabase';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'AccountSettings'>;

interface ItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

const SettingItem = ({ icon, title, subtitle, onPress, isDestructive }: ItemProps) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
        <Icon name={icon} size={18} color={isDestructive ? colors.error : colors.primaryAccent} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, isDestructive && styles.destructiveText]}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

const AccountSettingsScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = useCallback(async () => {
    try {
      await authService.signOut();
      dispatch(logout());
      await persistor.purge();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }, [dispatch]);

  const handleDeleteAccount = useCallback(() => {
    if (!user) return;
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your NimbusX account and wipe all profile data? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete profile row from database
              await supabase.from('profiles').delete().eq('id', user.uid);
              // Sign out from auth service
              await authService.signOut();
              // Reset auth state in Redux
              dispatch(logout());
              // Purge local database persistence store
              await persistor.purge();
              Alert.alert('Account Wiped', 'Your account and database profiles have been deleted.');
            } catch (error) {
              console.error('Failed to delete user account:', error);
              Alert.alert('Error', 'An error occurred while deleting your account. Please try again.');
            }
          },
        },
      ]
    );
  }, [user, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile & Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingItem
            icon="person-outline"
            title="Profile"
            subtitle="Edit name and avatar"
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="phone-portrait-outline"
            title="Change Number"
            subtitle="Migrate your account to a new number"
            onPress={() => navigation.navigate('ChangeNumber')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="hardware-chip-outline"
            title="Devices"
            subtitle="View and manage linked sessions"
            onPress={() => navigation.navigate('Devices')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text-outline"
            title="Request Account Info"
            subtitle="Download a report of your data"
            onPress={() => navigation.navigate('RequestInfo')}
          />
        </View>

        {/* Privacy & Security */}
        <Text style={styles.sectionLabel}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <SettingItem
            icon="eye-outline"
            title="Privacy"
            subtitle="Last seen, read receipts, profile photo"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="App lock, encryption details, 2FA"
            onPress={() => navigation.navigate('SecuritySettings')}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>SESSION</Text>
        <View style={styles.card}>
          <SettingItem
            icon="log-out-outline"
            title="Log Out"
            onPress={handleLogout}
            isDestructive
          />
          <View style={styles.divider} />
          <SettingItem
            icon="trash-outline"
            title="Delete My Account"
            subtitle="Permanently remove all data"
            onPress={handleDeleteAccount}
            isDestructive
          />
        </View>
      </ScrollView>
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
    overflow: 'hidden',
    marginBottom: spacing.s,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 56,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  iconBoxDestructive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.error,
  },
}));

export default AccountSettingsScreen;
