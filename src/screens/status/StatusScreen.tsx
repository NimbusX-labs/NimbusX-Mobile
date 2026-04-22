import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/firebase/firestore';
import { storageService } from '@services/firebase/storage';
import { Status } from '@types';

const STATUS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── StatusRing — coloured arc indicating live statuses ─────────────────────

const StatusRing = ({ count }: { count: number }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (count > 0) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ).start();
    }
  }, [count, spinAnim]);

  return (
    <View
      style={[
        styles.ring,
        {
          borderColor: count > 0 ? colors.primaryAccent : colors.divider,
          borderWidth: count > 0 ? 2.5 : 1.5,
        },
      ]}
    >
      {count > 0 && (
        <View style={styles.ringBadge}>
          <Text style={styles.ringBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
};

// ─── StatusCard ─────────────────────────────────────────────────────────────

const StatusCard = React.memo(({ item }: { item: Status }) => (
  <View style={styles.card}>
    {item.imageUrl ? (
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
    ) : (
      <View style={styles.cardTextOnly}>
        <Icon name="chatbubble-ellipses-outline" size={18} color={colors.primaryAccent} />
      </View>
    )}
    <View style={styles.cardBody}>
      {item.text ? (
        <Text style={styles.cardText} numberOfLines={2}>
          {item.text}
        </Text>
      ) : null}
      <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
    </View>
  </View>
));

// ─── Main Screen ─────────────────────────────────────────────────────────────

const StatusScreen = () => {
  const user = useAppSelector(state => state.auth.user);
  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? 'Me';
  const avatarUrl = user?.avatarUrl;

  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Subscribe to live Firestore statuses
  useEffect(() => {
    const unsub = firestoreService.listenStatuses(setAllStatuses);
    return unsub;
  }, []);

  const myStatuses = allStatuses.filter(s => s.uid === uid);
  const otherStatuses = allStatuses.filter(s => s.uid !== uid);

  // ── Composer helpers ──────────────────────────────────────────────────────

  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setText('');
    setSelectedImage(null);
  }, []);

  const pickImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.assets && result.assets[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const postStatus = useCallback(async () => {
    if (!text.trim() && !selectedImage) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;

      // Try to upload the image — if Storage isn't set up yet, skip it and post text-only
      if (selectedImage) {
        try {
          imageUrl = await storageService.uploadStatusImage(uid, selectedImage);
        } catch (storageErr: any) {
          console.warn('Image upload failed, posting text-only:', storageErr?.message);
          // Remove the selected image so we don't mislead the user
          setSelectedImage(null);
          Alert.alert(
            'Photo skipped',
            'Could not upload the photo (Firebase Storage may not be set up). Your text status will still be posted.',
          );
        }
      }

      // Only post if we have text or a successfully uploaded image
      if (!text.trim() && !imageUrl) {
        setPosting(false);
        return;
      }

      const now = Date.now();
      await firestoreService.postStatus({
        uid,
        displayName,
        avatarUrl,
        text: text.trim() || undefined,
        imageUrl,
        createdAt: now,
        expiresAt: now + STATUS_TTL_MS,
      });
      closeComposer();
    } catch (e) {
      Alert.alert('Error', 'Could not post status. Please try again.');
      console.error('Post status failed:', e);
    } finally {
      setPosting(false);
    }
  }, [text, selectedImage, uid, displayName, avatarUrl, closeComposer]);

  const canPost = !posting && (!!text.trim() || !!selectedImage);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── My status row ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY STATUS</Text>
          <TouchableOpacity style={styles.myRow} onPress={openComposer} activeOpacity={0.7}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <StatusRing count={myStatuses.length} />
              <View style={styles.addBadge}>
                <Icon name="add" size={12} color={colors.white} />
              </View>
            </View>
            <View style={styles.myText}>
              <Text style={styles.myTitle}>
                {myStatuses.length > 0 ? 'Add to my status' : 'Tap to add status'}
              </Text>
              <Text style={styles.mySubTitle}>
                {myStatuses.length > 0
                  ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} · visible 24h`
                  : 'Photo or text update'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.divider} />
          </TouchableOpacity>
        </View>

        {/* ── My updates list ── */}
        {myStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY UPDATES</Text>
            {myStatuses.map(item => (
              <StatusCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* ── Recent updates from others ── */}
        {otherStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT UPDATES</Text>
            {otherStatuses.map(item => (
              <TouchableOpacity key={item.id} style={styles.contactRow} activeOpacity={0.7}>
                <View style={styles.avatarWrap}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {item.displayName[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <StatusRing count={1} />
                </View>
                <View style={styles.myText}>
                  <Text style={styles.myTitle}>{item.displayName}</Text>
                  <Text style={styles.mySubTitle}>{timeAgo(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {allStatuses.length === 0 && (
          <View style={styles.emptyWrap}>
            <Icon name="sparkles-outline" size={52} color={colors.divider} />
            <Text style={styles.emptyTitle}>No status updates yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to share a photo or text update that disappears in 24 hours.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openComposer} activeOpacity={0.85}>
        <Icon name="add" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* ── Composer Modal ── */}
      <Modal
        visible={composerOpen}
        transparent
        animationType="slide"
        onRequestClose={closeComposer}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={closeComposer} activeOpacity={1} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Status</Text>

            {/* Image preview */}
            {selectedImage ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setSelectedImage(null)}
                >
                  <Icon name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImage} activeOpacity={0.7}>
                <Icon name="image-outline" size={28} color={colors.primaryAccent} />
                <Text style={styles.photoPickerText}>Add a photo</Text>
              </TouchableOpacity>
            )}

            {/* Text input */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              maxLength={700}
            />
            <Text style={styles.charCount}>{text.length}/700</Text>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={closeComposer}
                disabled={posting}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, !canPost && styles.btnDisabled]}
                onPress={postStatus}
                disabled={!canPost}
              >
                {posting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.btnText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.primaryAccent,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    fontSize: 11,
    letterSpacing: 1,
  },
  // ── My row ──
  myRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.m,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.m,
  },
  avatarWrap: {
    position: 'relative',
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.cardBackground,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAccent,
  },
  avatarInitial: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  ring: {
    position: 'absolute',
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
  },
  ringBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  ringBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryBackground,
  },
  myText: {
    flex: 1,
    marginLeft: spacing.l,
  },
  myTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
  },
  mySubTitle: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: typography.fontSize.small,
  },
  // ── Cards ──
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.m,
  },
  cardTextOnly: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
  },
  cardImage: {
    width: 72,
    height: 72,
  },
  cardBody: {
    flex: 1,
    padding: spacing.m,
  },
  cardText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    marginBottom: 4,
  },
  cardTime: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
  },
  // ── Empty state ──
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.l,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
  },
  emptyText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ── FAB ──
  fab: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colors.secondaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.divider,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: spacing.l,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
    marginBottom: spacing.l,
  },
  // ── Photo picker ──
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    marginBottom: spacing.l,
  },
  photoPickerText: {
    color: colors.primaryAccent,
    fontWeight: '600',
    fontSize: typography.fontSize.medium,
    marginLeft: spacing.m,
  },
  // ── Image preview ──
  imagePreviewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.l,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeImage: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    backgroundColor: colors.primaryBackground,
    borderRadius: 12,
  },
  // ── Text input ──
  input: {
    minHeight: 80,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.divider,
    fontSize: typography.fontSize.regular,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.l,
  },
  // ── Buttons ──
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: 12,
    marginLeft: spacing.m,
    minWidth: 80,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: typography.fontSize.regular,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.regular,
  },
});

export default StatusScreen;
