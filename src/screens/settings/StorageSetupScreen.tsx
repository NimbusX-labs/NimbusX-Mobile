import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setStorageMode, StorageMode } from '@store/slices/authSlice';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Toast from 'react-native-toast-message';

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
}

const OptionCard = ({ icon, title, description, selected, onPress }: OptionCardProps) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
        <Icon name={icon} size={28} color={selected ? '#080E1A' : colors.primaryAccent} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      {selected ? (
        <Icon name="checkmark-circle" size={22} color={colors.primaryAccent} />
      ) : (
        <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
};

const StorageSetupScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector((state) => state.auth.storageMode);

  const handleSelect = useCallback((mode: StorageMode) => {
    dispatch(setStorageMode(mode));
    Toast.show({
      type: 'success',
      text1: 'Storage Mode Changed',
      text2: mode === 'cloud' ? 'Cloud Sync enabled — your data stays in sync across devices.' : 'Local Only mode enabled — everything stays on this device.',
      visibilityTime: 3000,
      position: 'bottom',
    });
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBackground} />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="shield-checkmark" size={32} color={colors.primaryAccent} />
          </View>
          <Text style={styles.title}>How do you want to store your data?</Text>
          <Text style={styles.subtitle}>
            You can change this later in Settings.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <OptionCard
            icon="phone-portrait-outline"
            title="Local Only"
            description="Everything stays on your device."
            selected={currentMode === 'local'}
            onPress={() => handleSelect('local')}
          />
          <OptionCard
            icon="cloud-outline"
            title="Cloud Sync"
            description="Access your chats and files from anywhere."
            selected={currentMode === 'cloud'}
            onPress={() => handleSelect('cloud')}
          />
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Your messages are always end-to-end private.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xlarge,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.s,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.regular,
  },
  options: {
    gap: spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardSelected: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(6,182,212,0.06)',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: colors.primaryAccent,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.l,
  },
  cardTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: colors.primaryAccent,
  },
  cardDescription: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.small,
  },
  footerNote: {
    marginTop: spacing.xxxl,
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },
}));

export default StorageSetupScreen;
