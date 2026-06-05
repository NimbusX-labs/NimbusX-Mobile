import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUser } from '@store/slices/authSlice';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';

const ProfileScreen = () => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const storageMode = useAppSelector((state) => state.auth.storageMode);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      // Preview locally immediately
      setLocalAvatarUri(result.assets[0].uri || null);
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;

    setLoading(true);
    try {
      let avatarUrl = user.avatarUrl;

      // If a new image was selected, upload it first
      if (localAvatarUri) {
        avatarUrl = await storageService.uploadAvatar(user.uid, localAvatarUri);
      }

      await firestoreService.saveUser({
        uid: user.uid,
        displayName: displayName.trim(),
        avatarUrl,
      });

      dispatch(setUser({ ...user, displayName: displayName.trim(), avatarUrl }));
      setLocalAvatarUri(null); // Reset local preview state since it's now saved
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const storageModeLabel = storageMode === 'cloud' ? 'Cloud Sync' : 'Local Only';
  const storageModeIcon = storageMode === 'cloud' ? 'cloud-outline' : 'phone-portrait-outline';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickImage}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Avatar
                uri={localAvatarUri || user?.avatarUrl}
                name={displayName || user?.email}
                size={96}
              />
              <View style={styles.editBadge}>
                <Icon name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Name Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Icon name="person-outline" size={16} color={colors.primaryAccent} />
                <Text style={styles.label}>Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={styles.hint}>
                This is not your username or pin. This name will be visible to your NimbusX contacts.
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Email (read-only) */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Icon name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.label}>Email</Text>
              </View>
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Storage Mode Badge */}
            <View style={styles.storageBadgeRow}>
              <View style={styles.storageBadgeIconWrap}>
                <Icon name={storageModeIcon} size={14} color={colors.primaryAccent} />
              </View>
              <Text style={styles.storageBadgeLabel}>Storage</Text>
              <View style={styles.storageBadgePill}>
                <Text style={styles.storageBadgeText}>{storageModeLabel}</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveText}>Save Profile</Text>
            )}
          </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primaryAccent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.primaryBackground,
  },
  avatarHint: {
    marginTop: spacing.s,
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
  },
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.l,
    marginBottom: spacing.xl,
  },
  fieldGroup: {
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    marginLeft: spacing.s,
  },
  input: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: Platform.OS === 'ios' ? spacing.m : spacing.s,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.tiny,
    marginTop: spacing.s,
    lineHeight: typography.lineHeight.tiny,
  },
  infoText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: Platform.OS === 'ios' ? spacing.m : spacing.s,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.m,
  },
  storageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  storageBadgeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageBadgeLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: spacing.s,
    flex: 1,
  },
  storageBadgePill: {
    backgroundColor: colors.accentMuted,
    borderRadius: 6,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
  },
  storageBadgeText: {
    fontSize: typography.fontSize.tiny,
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 10,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.fontSize.regular,
  },
  disabled: {
    opacity: 0.6,
  },
}));

export default ProfileScreen;
