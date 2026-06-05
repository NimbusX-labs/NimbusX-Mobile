import React, { useCallback, useEffect, useState, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { Status } from '@types';
import Avatar from '@components/common/Avatar';

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

// High-quality mock data matching the screenshot design
const MOCK_ELENA_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
const MOCK_MARCUS_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
const MOCK_SARAH_AVATAR = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80';
const MOCK_DAVID_AVATAR = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80';

const MOCK_ELENA_POST = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const MOCK_MARCUS_POST = 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=300&q=80';
const MOCK_SYSTEM_POST = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80';

const StatusScreen = () => {
  const colors = useThemeColors();
  const user = useAppSelector(state => state.auth.user);
  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? 'Me';
  const avatarUrl = user?.avatarUrl;
  const navigation = useNavigation<any>();

  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Hide default react navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Subscribe to live Firestore statuses
  useEffect(() => {
    const unsub = firestoreService.listenStatuses(setAllStatuses);
    return unsub;
  }, []);

  const myStatuses = allStatuses.filter(s => s.uid === uid);

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

      if (selectedImage) {
        try {
          imageUrl = await storageService.uploadStatusImage(uid, selectedImage);
        } catch (storageErr: any) {
          console.warn('Image upload failed, posting text-only:', storageErr?.message);
          setSelectedImage(null);
          Alert.alert(
            'Photo skipped',
            'Could not upload the photo. Your text status will still be posted.',
          );
        }
      }

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

  const handleSendReply = (name: string) => {
    if (!replyText.trim()) return;
    Alert.alert('Reply Sent', `Your reply to ${name} has been sent.`);
    setReplyText('');
  };

  const canPost = !posting && (!!text.trim() || !!selectedImage);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Custom NimbusX Logo Header ── */}
      <View style={styles.customHeader}>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerLeftBtn}>
          <Icon name="cloud" size={24} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NimbusX</Text>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => navigation.navigate('Profile')}
          style={styles.headerRightBtn}
        >
          <View style={styles.profileIconOutline}>
            <Avatar uri={avatarUrl} name={displayName} size={28} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Recent Updates (Horizontal Row) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Updates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.updatesScroll}
          >
            {/* Add Status Button */}
            <TouchableOpacity style={styles.avatarColumn} onPress={openComposer} activeOpacity={0.75}>
              <View style={styles.avatarBorderWrapper}>
                <View style={styles.addStatusCircle}>
                  <Icon name="add" size={20} color="#00E5FF" />
                </View>
              </View>
              <Text style={styles.avatarLabel} numberOfLines={1}>Add Status</Text>
            </TouchableOpacity>

            {/* My Status (if posted) */}
            {myStatuses.length > 0 && (
              <TouchableOpacity style={styles.avatarColumn} activeOpacity={0.75}>
                <View style={[styles.avatarBorderWrapper, styles.avatarBorderWrapperActive]}>
                  <Avatar uri={avatarUrl} name={displayName} size={50} />
                </View>
                <Text style={styles.avatarLabel} numberOfLines={1}>My Status</Text>
              </TouchableOpacity>
            )}

            {/* Elena */}
            <TouchableOpacity style={styles.avatarColumn} activeOpacity={0.75}>
              <View style={[styles.avatarBorderWrapper, styles.avatarBorderWrapperActive]}>
                <Avatar uri={MOCK_ELENA_AVATAR} name="Elena" size={50} />
              </View>
              <Text style={styles.avatarLabel} numberOfLines={1}>Elena</Text>
            </TouchableOpacity>

            {/* Marcus */}
            <TouchableOpacity style={styles.avatarColumn} activeOpacity={0.75}>
              <View style={[styles.avatarBorderWrapper, styles.avatarBorderWrapperActive]}>
                <Avatar uri={MOCK_MARCUS_AVATAR} name="Marcus" size={50} />
              </View>
              <Text style={styles.avatarLabel} numberOfLines={1}>Marcus</Text>
            </TouchableOpacity>

            {/* Sarah */}
            <TouchableOpacity style={styles.avatarColumn} activeOpacity={0.75}>
              <View style={styles.avatarBorderWrapper}>
                <Avatar uri={MOCK_SARAH_AVATAR} name="Sarah" size={50} />
              </View>
              <Text style={styles.avatarLabel} numberOfLines={1}>Sarah</Text>
            </TouchableOpacity>

            {/* David */}
            <TouchableOpacity style={styles.avatarColumn} activeOpacity={0.75}>
              <View style={styles.avatarBorderWrapper}>
                <Avatar uri={MOCK_DAVID_AVATAR} name="David" size={50} />
              </View>
              <Text style={styles.avatarLabel} numberOfLines={1}>David</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Discover Feed ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover</Text>

          {/* Elena's Large Premium Update Card */}
          <View style={styles.discoverCardLarge}>
            <Image source={{ uri: MOCK_ELENA_POST }} style={styles.largeCardBg} resizeMode="cover" />
            
            {/* Elena Profile Overlay */}
            <View style={styles.largeCardHeader}>
              <Avatar uri={MOCK_ELENA_AVATAR} name="Elena" size={24} />
              <Text style={styles.largeCardUser}>Elena</Text>
            </View>

            {/* Reply Input Overlay */}
            <View style={styles.replyOverlay}>
              <TextInput
                style={styles.replyInput}
                placeholder="Reply to update..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity 
                style={styles.replySendBtn} 
                onPress={() => handleSendReply('Elena')}
                activeOpacity={0.7}
              >
                <Icon name="send" size={14} color="#080E1A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Real user updates from database (rendered dynamically if they exist) */}
          {allStatuses.filter(s => s.uid !== 'elena' && s.uid !== 'marcus').map(status => (
            <View key={status.id} style={styles.discoverCardLarge}>
              {status.imageUrl ? (
                <Image source={{ uri: status.imageUrl }} style={styles.largeCardBg} resizeMode="cover" />
              ) : (
                <View style={[styles.largeCardBg, styles.largeCardBgTextOnly]}>
                  <Text style={status.text && status.text.length > 80 ? styles.statusTextSmall : styles.statusTextLarge}>
                    {status.text}
                  </Text>
                </View>
              )}
              
              <View style={styles.largeCardHeader}>
                <Avatar uri={status.avatarUrl} name={status.displayName} size={24} />
                <Text style={styles.largeCardUser}>{status.displayName}</Text>
              </View>

              {status.imageUrl && status.text && (
                <View style={status.text.length > 60 ? styles.realStatusDescSmall : styles.realStatusDesc}>
                  <Text style={styles.realStatusDescText} numberOfLines={2}>
                    {status.text}
                  </Text>
                </View>
              )}

              <View style={styles.replyOverlay}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Reply to update..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
                <TouchableOpacity style={styles.replySendBtn} activeOpacity={0.7}>
                  <Icon name="send" size={14} color="#080E1A" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* 2-Column Grid of Updates */}
          <View style={styles.discoverGrid}>
            {/* Left Card: Marcus */}
            <View style={styles.gridCard}>
              <Image source={{ uri: MOCK_MARCUS_POST }} style={styles.gridCardBg} resizeMode="cover" />
              
              {/* Cyan active dot indicator */}
              <View style={styles.activeIndicatorDot} />

              <View style={styles.gridCardFooter}>
                <Avatar uri={MOCK_MARCUS_AVATAR} name="Marcus" size={18} />
                <Text style={styles.gridCardUser} numberOfLines={1}>Marcus</Text>
              </View>
            </View>

            {/* Right Card: System */}
            <View style={styles.gridCard}>
              <Image source={{ uri: MOCK_SYSTEM_POST }} style={styles.gridCardBg} resizeMode="cover" />
              
              <View style={styles.gridCardFooter}>
                <View style={styles.systemAvatarPlaceholder}>
                  <Icon name="server-outline" size={10} color="#00E5FF" />
                </View>
                <Text style={styles.gridCardUser} numberOfLines={1}>System</Text>
              </View>
            </View>
          </View>

          {/* Explore More Card */}
          <TouchableOpacity style={styles.exploreCard} activeOpacity={0.85}>
            <View style={styles.exploreIconCircle}>
              <Icon name="compass-outline" size={26} color="#00E5FF" />
            </View>
            <Text style={styles.exploreTitle}>Explore More</Text>
            <Text style={styles.exploreSubtitle}>
              Discover updates from across your secure network.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Plus FAB */}
      <TouchableOpacity style={styles.fab} onPress={openComposer} activeOpacity={0.85}>
        <Icon name="add" size={26} color="#080E1A" />
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
                <Icon name="image-outline" size={28} color="#00E5FF" />
                <Text style={styles.photoPickerText}>Add a photo</Text>
              </TouchableOpacity>
            )}

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
                  <ActivityIndicator size="small" color="#080E1A" />
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

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  // ── Custom NimbusX Logo Header ──
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: colors.primaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerLeftBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 0.5,
  },
  headerRightBtn: {
    padding: spacing.xs,
  },
  profileIconOutline: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    padding: 2,
  },
  // ── Section ──
  section: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.l,
  },
  // ── Updates Row ──
  updatesScroll: {
    gap: spacing.m,
    paddingRight: spacing.l,
  },
  avatarColumn: {
    alignItems: 'center',
    width: 68,
  },
  avatarBorderWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#374151',
  },
  avatarBorderWrapperActive: {
    borderColor: '#00E5FF',
  },
  addStatusCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  // ── Discover Feed ──
  discoverCardLarge: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: spacing.m,
    position: 'relative',
  },
  largeCardBg: {
    width: '100%',
    height: '100%',
  },
  largeCardBgTextOnly: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  statusTextLarge: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusTextSmall: {
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  largeCardHeader: {
    position: 'absolute',
    top: spacing.m,
    left: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,26,0.6)',
    borderRadius: 14,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
  },
  largeCardUser: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  realStatusDesc: {
    position: 'absolute',
    bottom: 60,
    left: spacing.m,
    right: spacing.m,
    backgroundColor: 'rgba(8,14,26,0.6)',
    borderRadius: 10,
    padding: spacing.s,
  },
  realStatusDescSmall: {
    position: 'absolute',
    bottom: 54,
    left: spacing.m,
    right: spacing.m,
    backgroundColor: 'rgba(8,14,26,0.65)',
    borderRadius: 10,
    padding: spacing.s,
  },
  realStatusDescText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  replyOverlay: {
    position: 'absolute',
    bottom: spacing.m,
    left: spacing.m,
    right: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,26,0.65)',
    borderRadius: 18,
    paddingLeft: spacing.m,
    paddingRight: 3,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  replyInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  replySendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Discover Grid ──
  discoverGrid: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  gridCard: {
    flex: 1,
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
    position: 'relative',
  },
  gridCardBg: {
    width: '100%',
    height: '100%',
  },
  activeIndicatorDot: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00E5FF',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  gridCardFooter: {
    position: 'absolute',
    bottom: spacing.s,
    left: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,14,26,0.6)',
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    maxWidth: '85%',
  },
  gridCardUser: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  systemAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(8,14,26,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Explore Card ──
  exploreCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    marginTop: spacing.s,
  },
  exploreIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  exploreTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  exploreSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: spacing.m,
    lineHeight: 18,
  },
  // ── FAB ──
  fab: {
    position: 'absolute',
    right: spacing.l,
    bottom: spacing.l,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#374151',
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4B5563',
    marginBottom: spacing.l,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.l,
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    marginBottom: spacing.l,
  },
  photoPickerText: {
    color: '#00E5FF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: spacing.m,
  },
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
    backgroundColor: 'rgba(8,14,26,0.7)',
    borderRadius: 12,
  },
  input: {
    minHeight: 80,
    color: colors.textPrimary,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 15,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.l,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    backgroundColor: '#00E5FF',
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
    color: '#080E1A',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
}));

export default StatusScreen;
