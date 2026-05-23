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
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { setUser } from '@store/slices/authSlice';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={loading}>
            <Avatar uri={localAvatarUri || user?.avatarUrl} name={displayName || user?.email} size={120} />
            <View style={styles.editBadge}>
              <Icon name="camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Icon name="person-outline" size={24} color={colors.primaryAccent} />
              <Text style={styles.label}>Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.hint}>This is not your username or pin. This name will be visible to your NimbusX contacts.</Text>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Icon name="mail-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.label}>Email</Text>
            </View>
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save Profile</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.massive,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryAccent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primaryBackground,
  },
  inputSection: {
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    marginLeft: spacing.m,
  },
  input: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryAccent,
    paddingVertical: spacing.s,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.s,
    lineHeight: 18,
  },
  infoText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primaryAccent,
    width: '100%',
    paddingVertical: spacing.l,
    borderRadius: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
  },
  disabled: {
    opacity: 0.7,
  },
});

export default ProfileScreen;
