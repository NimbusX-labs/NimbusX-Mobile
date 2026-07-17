import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '@store/hooks';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useIdentity } from '@hooks/useIdentity';
import Avatar from '@components/common/Avatar';

const QRCodeScreen = () => {
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const { getQRCode, getProfileLink, getShareCodeLink, getUserProfileLink } = useIdentity();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profileLink = getUserProfileLink(user || {});

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      const input = user?.username || user?.shareCode || '';
      if (!input) {
        setLoading(false);
        return;
      }
      const dataUrl = await getQRCode(input);
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!profileLink) return;
    Clipboard.setString(profileLink);
    Alert.alert('Copied', 'Profile link copied to clipboard.');
  };

  const handleShare = async () => {
    if (!profileLink) return;
    try {
      await Share.share({
        message: `Connect with me on NimbusX!\n${profileLink}`,
        title: 'NimbusX Profile',
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const displayName = user?.displayName || user?.email || 'User';
  const identifier = user?.username ? `@${user.username}` : user?.shareCode || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Avatar uri={user?.avatarUrl} name={displayName} size={64} />
          <Text style={styles.displayName}>{displayName}</Text>
          {identifier ? <Text style={styles.identifier}>{identifier}</Text> : null}
        </View>

        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primaryAccent} />
          ) : qrDataUrl ? (
            <View style={styles.qrWrapper}>
              <Text style={styles.qrPlaceholder}>QR Code</Text>
              <Text style={styles.qrSubtext}>Scan to connect</Text>
            </View>
          ) : (
            <View style={styles.qrWrapper}>
              <Icon name="qr-code-outline" size={80} color={colors.textTertiary} />
              <Text style={styles.noQrText}>Set a username to generate QR code</Text>
            </View>
          )}
        </View>

        {/* Share Code Display */}
        {user?.shareCode ? (
          <View style={styles.shareCodeRow}>
            <Icon name="key-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.shareCodeText}>Share Code: {user.shareCode}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Icon name="copy-outline" size={20} color={colors.primaryAccent} />
            <Text style={styles.actionText}>Copy Profile Link</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Icon name="share-outline" size={20} color={colors.primaryAccent} />
            <Text style={styles.actionText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        {profileLink ? (
          <Text style={styles.linkText} numberOfLines={1}>{profileLink}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  content: {
    flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  userInfo: { alignItems: 'center', marginBottom: spacing.xl },
  displayName: {
    fontSize: typography.fontSize.xlarge, fontWeight: '700',
    color: colors.textPrimary, marginTop: spacing.m,
  },
  identifier: {
    fontSize: typography.fontSize.medium, color: colors.primaryAccent,
    fontWeight: '500', marginTop: spacing.xs,
  },
  qrContainer: {
    width: 240, height: 240, borderRadius: 20,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1, borderColor: colors.divider,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.l,
  },
  qrWrapper: { alignItems: 'center', gap: spacing.s },
  qrPlaceholder: {
    fontSize: typography.fontSize.large, fontWeight: '700',
    color: colors.primaryAccent,
  },
  qrSubtext: { fontSize: typography.fontSize.small, color: colors.textSecondary },
  noQrText: {
    fontSize: typography.fontSize.small, color: colors.textTertiary,
    textAlign: 'center', marginTop: spacing.s,
  },
  shareCodeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s,
    marginBottom: spacing.xl,
  },
  shareCodeText: {
    fontSize: typography.fontSize.regular, color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsCard: {
    width: '100%', backgroundColor: colors.secondaryBackground,
    borderRadius: 14, borderWidth: 1, borderColor: colors.divider,
    overflow: 'hidden', marginBottom: spacing.l,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.l,
    gap: spacing.m,
  },
  actionText: { fontSize: typography.fontSize.regular, fontWeight: '500', color: colors.textPrimary },
  actionDivider: { height: 0.5, backgroundColor: colors.divider, marginLeft: 52 },
  linkText: {
    fontSize: typography.fontSize.tiny, color: colors.textTertiary,
    textAlign: 'center',
  },
}));

export default QRCodeScreen;
