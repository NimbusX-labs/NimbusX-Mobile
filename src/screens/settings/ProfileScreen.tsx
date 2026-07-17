import React, { useState, useEffect } from 'react';
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
  Alert,
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
import { useIdentity } from '@hooks/useIdentity';
import Avatar from '@components/common/Avatar';

const ProfileScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const storageMode = useAppSelector((state) => state.auth.storageMode);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const { getProfileLink, getShareCodeLink, getUserProfileLink } = useIdentity();

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets || result.assets.length === 0) return;
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
      if (localAvatarUri) {
        avatarUrl = await storageService.uploadAvatar(user.uid, localAvatarUri);
      }
      await firestoreService.saveUser({
        uid: user.uid,
        displayName: displayName.trim(),
        avatarUrl,
      });
      dispatch(setUser({ ...user, displayName: displayName.trim(), avatarUrl }));
      setLocalAvatarUri(null);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const profileLink = getUserProfileLink(user || {});

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
          </View>

          {/* Profile Info Card */}
          <View style={styles.card}>
            {/* Display Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Icon name="person-outline" size={16} color={colors.primaryAccent} />
                <Text style={styles.label}>Display Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.divider} />

            {/* Username (Nimbus ID) */}
            <TouchableOpacity
              style={styles.fieldGroup}
              onPress={() => navigation.navigate('UsernameSetup')}
              activeOpacity={0.7}
            >
              <View style={styles.fieldBetween}>
                <View style={styles.fieldLabel}>
                  <Icon name="at-outline" size={16} color={colors.primaryAccent} />
                  <Text style={styles.label}>Nimbus ID</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
              <Text style={styles.valueText}>
                {user?.username ? `@${user.username}` : 'Tap to set'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Share Code */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Icon name="key-outline" size={16} color={colors.primaryAccent} />
                <Text style={styles.label}>Share Code</Text>
              </View>
              <Text style={styles.valueText}>{user?.shareCode || '—'}</Text>
            </View>

            <View style={styles.divider} />

            {/* Phone Verification Status */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Icon
                  name={user?.phoneE164 ? 'shield-checkmark-outline' : 'shield-outline'}
                  size={16}
                  color={user?.phoneE164 ? '#22c55e' : colors.textSecondary}
                />
                <Text style={styles.label}>Phone</Text>
              </View>
              <View style={styles.badgeRow}>
                {user?.phoneE164 ? (
                  <>
                    <Text style={styles.valueText}>{user.phoneE164}</Text>
                    <View style={[styles.badge, styles.badgeVerified]}>
                      <Text style={styles.badgeText}>Verified</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.valueText, { color: colors.textTertiary }]}>Not verified</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ChangeNumber')}
                    >
                      <Text style={styles.actionText}>Add Phone</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Actions Card */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('QRCode')}
              activeOpacity={0.7}
            >
              <Icon name="qr-code-outline" size={20} color={colors.primaryAccent} />
              <Text style={styles.actionRowText}>My QR Code</Text>
              <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (profileLink) {
                  Alert.alert('Profile Link', profileLink);
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="share-outline" size={20} color={colors.primaryAccent} />
              <Text style={styles.actionRowText}>Share Profile</Text>
              <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.l, paddingVertical: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarContainer: { position: 'relative' },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: colors.primaryAccent, width: 30, height: 30,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: colors.primaryBackground,
  },
  card: {
    backgroundColor: colors.secondaryBackground, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    padding: spacing.l, marginBottom: spacing.l,
  },
  fieldGroup: { paddingVertical: spacing.xs },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s },
  fieldBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    color: colors.textSecondary, fontSize: typography.fontSize.small,
    fontWeight: '500', marginLeft: spacing.s,
  },
  input: {
    color: colors.textPrimary, fontSize: typography.fontSize.regular,
    backgroundColor: colors.inputBackground, borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    paddingHorizontal: spacing.m, paddingVertical: Platform.OS === 'ios' ? spacing.m : spacing.s,
  },
  valueText: {
    color: colors.textPrimary, fontSize: typography.fontSize.regular,
    marginLeft: 24,
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', marginLeft: 24, gap: spacing.s,
  },
  badge: {
    paddingHorizontal: spacing.s, paddingVertical: 2, borderRadius: 6,
  },
  badgeVerified: { backgroundColor: '#22c55e20' },
  badgeText: { fontSize: typography.fontSize.tiny, fontWeight: '700', color: '#22c55e' },
  actionText: { fontSize: typography.fontSize.small, fontWeight: '600', color: colors.primaryAccent },
  divider: {
    height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.m,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s, gap: spacing.m,
  },
  actionRowText: { flex: 1, fontSize: typography.fontSize.regular, fontWeight: '500', color: colors.textPrimary },
  saveButton: {
    backgroundColor: colors.primaryAccent, borderRadius: 10,
    paddingVertical: spacing.m, alignItems: 'center', justifyContent: 'center', height: 48,
  },
  saveText: { color: colors.white, fontWeight: '600', fontSize: typography.fontSize.regular },
  disabled: { opacity: 0.6 },
}));

export default ProfileScreen;
