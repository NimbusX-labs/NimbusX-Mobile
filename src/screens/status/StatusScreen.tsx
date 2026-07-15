import React, { useCallback, useEffect, useState, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
import { chatSelectors } from '@store/slices/chatSlice';
import { Status, User } from '@types';
import Avatar from '@components/common/Avatar';

const PULSE_TTL_MS = 24 * 60 * 60 * 1000;

const StatusScreen = () => {
  const colors = useThemeColors();
  const user = useAppSelector(state => state.auth.user);
  const uid = user?.uid ?? '';
  const displayName = user?.displayName ?? 'Me';
  const avatarUrl = user?.avatarUrl;
  const navigation = useNavigation<any>();
  const chats = useAppSelector(chatSelectors.selectAll);

  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStatus, setViewerStatus] = useState<Status | null>(null);
  const [viewerReplyText, setViewerReplyText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!uid) return;
    const unsub = firestoreService.listenStatuses(uid, setAllStatuses);
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = firestoreService.listenContacts(uid, setContacts);
    return unsub;
  }, [uid]);

  const handleReplyToPulse = async (status: Status, replyMsg: string) => {
    if (!replyMsg.trim() || !uid) return;
    try {
      const partnerUid = status.uid;
      let chatId = '';
      const existingChat = chats.find(c =>
        c.type === 'one-to-one' &&
        c.members?.includes(uid) &&
        c.members?.includes(partnerUid)
      );
      if (existingChat) {
        chatId = existingChat.id;
      } else {
        chatId = await firestoreService.createChat({
          type: 'one-to-one',
          members: [uid, partnerUid],
          unreadCount: { [uid]: 0, [partnerUid]: 0 },
          typing: { [uid]: false, [partnerUid]: false },
        });
      }
      const desc = status.imageUrl
        ? (status.text ? `[Pulse Photo] ${status.text}` : '[Pulse Photo]')
        : (status.text || '');
      await firestoreService.sendMessage({
        chatId,
        senderId: uid,
        text: `Pulse: ${desc}\n${replyMsg.trim()}`,
        createdAt: Date.now(),
        status: 'sent',
      });
      Alert.alert('Sent', `Reply sent to ${status.displayName}`);
    } catch (err) {
      console.error('Failed to reply:', err);
      Alert.alert('Error', 'Could not send reply.');
    }
  };

  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setText('');
    setSelectedImage(null);
    setSelectedRecipients([]);
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

  const toggleRecipient = useCallback((contact: User) => {
    setSelectedRecipients(prev => {
      const exists = prev.find(c => c.uid === contact.uid);
      if (exists) return prev.filter(c => c.uid !== contact.uid);
      return [...prev, contact];
    });
  }, []);

  const postPulse = useCallback(async () => {
    if (!text.trim() && !selectedImage) return;
    if (selectedRecipients.length === 0) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        try {
          imageUrl = await storageService.uploadStatusImage(uid, selectedImage);
        } catch (storageErr: any) {
          console.warn('Image upload failed:', storageErr?.message);
          setSelectedImage(null);
          Alert.alert('Photo skipped', 'Text pulse will still be posted.');
        }
      }
      if (!text.trim() && !imageUrl) { setPosting(false); return; }
      const now = Date.now();
      await firestoreService.postStatus({
        uid,
        displayName,
        avatarUrl,
        text: text.trim() || undefined,
        imageUrl,
        sharedWith: selectedRecipients.map(c => c.uid),
        createdAt: now,
        expiresAt: now + PULSE_TTL_MS,
      });
      closeComposer();
    } catch (e) {
      Alert.alert('Error', 'Could not post pulse.');
      console.error(e);
    } finally {
      setPosting(false);
    }
  }, [text, selectedImage, uid, displayName, avatarUrl, selectedRecipients, closeComposer]);

  const myPulses = React.useMemo(
    () => allStatuses.filter(s => s.uid === uid),
    [allStatuses, uid],
  );
  const incomingPulses = React.useMemo(
    () => allStatuses.filter(s => s.uid !== uid),
    [allStatuses, uid],
  );

  const canPost = !posting && (!!text.trim() || !!selectedImage) && selectedRecipients.length > 0;

  const renderPulseItem = useCallback(
    ({ item }: { item: Status }) => {
      const isMine = item.uid === uid;
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setViewerStatus(item);
            setViewerOpen(true);
          }}
          style={styles.pulseRow}
        >
          <Avatar
            uri={isMine ? avatarUrl : item.avatarUrl}
            name={isMine ? displayName : item.displayName}
            size={42}
          />
          <View style={styles.pulseRowContent}>
            <View style={styles.pulseRowHeader}>
              <Text style={styles.pulseRowName} numberOfLines={1}>
                {isMine ? `Me ${myPulses.length > 1 ? `(+${myPulses.length - 1})` : ''}` : item.displayName}
              </Text>
              <Text style={styles.pulseRowTime}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.pulseRowPreview}>
              {item.imageUrl && <Icon name="image-outline" size={14} color={colors.textSecondary} style={styles.previewIcon} />}
              <Text style={styles.pulseRowText} numberOfLines={1}>
                {item.text || (item.imageUrl ? 'Photo' : '')}
              </Text>
            </View>
          </View>
          {!isMine && (
            <TouchableOpacity
              style={styles.replyBtn}
              onPress={() => {
                setViewerStatus(item);
                setViewerOpen(true);
              }}
            >
              <Icon name="return-down-back" size={16} color="#00E5FF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [uid, avatarUrl, displayName, myPulses.length, colors.textSecondary],
  );

  const renderComposerContact = useCallback(
    ({ item }: { item: User }) => {
      const isSelected = selectedRecipients.some(c => c.uid === item.uid);
      return (
        <TouchableOpacity
          style={[styles.contactRow, isSelected && styles.contactRowSelected]}
          onPress={() => toggleRecipient(item)}
          activeOpacity={0.7}
        >
          <Avatar uri={item.avatarUrl} name={item.displayName} size={36} />
          <Text style={styles.contactName} numberOfLines={1}>{item.displayName}</Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Icon name="checkmark" size={14} color="#080E1A" />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedRecipients, toggleRecipient],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBackground} />

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

      <FlatList
        data={allStatuses}
        keyExtractor={item => item.id}
        renderItem={renderPulseItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity style={styles.newPulseBanner} onPress={openComposer} activeOpacity={0.8}>
            <View style={styles.newPulseIcon}>
              <Icon name="pulse" size={22} color="#080E1A" />
            </View>
            <Text style={styles.newPulseText}>Send a pulse to someone...</Text>
          </TouchableOpacity>
        }
        ListFooterComponent={
          myPulses.length > 0 && incomingPulses.length === 0 ? (
            <View style={styles.youSection}>
              <Text style={styles.youSectionLabel}>YOUR PULSES</Text>
              {myPulses.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.youPulseItem}
                  onPress={() => {
                    setViewerStatus(p);
                    setViewerOpen(true);
                  }}
                >
                  <View style={styles.youPulseDot} />
                  <Text style={styles.youPulseText} numberOfLines={1}>
                    {p.text || (p.imageUrl ? 'Photo' : '')}
                  </Text>
                  <Text style={styles.youPulseTime}>
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />

      {/* Composer Modal */}
      <Modal visible={composerOpen} transparent animationType="slide" onRequestClose={closeComposer}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={closeComposer} activeOpacity={1} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Pulse</Text>

            {selectedRecipients.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
                {selectedRecipients.map(c => (
                  <TouchableOpacity key={c.uid} style={styles.chip} onPress={() => toggleRecipient(c)}>
                    <Avatar uri={c.avatarUrl} name={c.displayName} size={18} />
                    <Text style={styles.chipText} numberOfLines={1}>{c.displayName}</Text>
                    <Icon name="close-circle" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedImage ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImage} onPress={() => setSelectedImage(null)}>
                  <Icon name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImage} activeOpacity={0.7}>
                <Icon name="image-outline" size={28} color="#00E5FF" />
                <Text style={styles.photoPickerText}>Add photo</Text>
              </TouchableOpacity>
            )}

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What's your pulse?"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              maxLength={700}
            />
            <Text style={styles.charCount}>{text.length}/700</Text>

            <Text style={styles.pickerLabel}>TO: ({selectedRecipients.length} selected)</Text>

            {contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Icon name="people-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.emptyContactsText}>No contacts — add some in Chats</Text>
              </View>
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={item => item.uid}
                renderItem={renderComposerContact}
                style={styles.contactList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={closeComposer} disabled={posting}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, !canPost && styles.btnDisabled]} onPress={postPulse} disabled={!canPost}>
                {posting ? (
                  <ActivityIndicator size="small" color="#080E1A" />
                ) : (
                  <Text style={styles.btnText}>Send Pulse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Simple Pulse Viewer (no auto-advance, just a detail view) */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <SafeAreaView style={styles.viewerContainer}>
          <StatusBar hidden />
          <View style={styles.viewerHeader}>
            <Avatar
              uri={(viewerStatus?.uid === uid ? avatarUrl : viewerStatus?.avatarUrl) || ''}
              name={viewerStatus?.displayName || ''}
              size={36}
            />
            <View style={styles.viewerUserInfo}>
              <Text style={styles.viewerUserName}>
                {viewerStatus?.uid === uid ? 'Me' : viewerStatus?.displayName}
              </Text>
              <Text style={styles.viewerUserTime}>
                {viewerStatus && new Date(viewerStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setViewerOpen(false)} style={styles.viewerCloseBtn}>
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.viewerContent}>
            {viewerStatus?.imageUrl ? (
              <Image source={{ uri: viewerStatus.imageUrl }} style={styles.viewerImage} resizeMode="contain" />
            ) : (
              <View style={styles.viewerTextBg}>
                <Text style={styles.viewerTextContent}>{viewerStatus?.text}</Text>
              </View>
            )}
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.viewerReplyContainer}>
            <TextInput
              style={styles.viewerReplyInput}
              placeholder="Reply..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={viewerReplyText}
              onChangeText={setViewerReplyText}
            />
            <TouchableOpacity
              style={styles.viewerReplySendBtn}
              onPress={() => {
                if (viewerStatus) {
                  handleReplyToPulse(viewerStatus, viewerReplyText);
                  setViewerReplyText('');
                  setViewerOpen(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="send" size={16} color="#080E1A" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: colors.primaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerLeftBtn: { padding: spacing.xs },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: '#00E5FF', letterSpacing: 0.5,
  },
  headerRightBtn: { padding: spacing.xs },
  profileIconOutline: {
    borderRadius: 16, borderWidth: 1.5, borderColor: '#00E5FF', padding: 2,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  newPulseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.l,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: '#374151',
    gap: spacing.m,
  },
  newPulseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPulseText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F2937',
  },
  pulseRowContent: {
    flex: 1,
    marginLeft: spacing.m,
  },
  pulseRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseRowName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pulseRowTime: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: spacing.s,
  },
  pulseRowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  previewIcon: {
    marginRight: 4,
  },
  pulseRowText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  replyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,229,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s,
  },
  youSection: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
  },
  youSectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.s,
  },
  youPulseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  youPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    marginRight: spacing.m,
  },
  youPulseText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
  },
  youPulseTime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#374151',
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
    maxHeight: '90%',
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
    marginBottom: spacing.m,
  },
  chipScroll: { maxHeight: 36, marginBottom: spacing.m },
  chipContainer: { gap: spacing.s, paddingRight: spacing.l },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 70,
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    marginBottom: spacing.m,
  },
  photoPickerText: {
    color: '#00E5FF', fontWeight: '600', fontSize: 13, marginLeft: spacing.s,
  },
  imagePreviewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.m,
    position: 'relative',
  },
  imagePreview: { width: '100%', height: 140, borderRadius: 14 },
  removeImage: {
    position: 'absolute', top: spacing.m, right: spacing.m,
    backgroundColor: 'rgba(8,14,26,0.7)', borderRadius: 12,
  },
  input: {
    minHeight: 56,
    color: colors.textPrimary,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.textSecondary, fontSize: 11, textAlign: 'right', marginTop: 2, marginBottom: spacing.s,
  },
  pickerLabel: {
    color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: spacing.s, letterSpacing: 0.5,
  },
  emptyContacts: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.m, gap: spacing.s,
  },
  emptyContactsText: { color: colors.textSecondary, fontSize: 12 },
  contactList: { maxHeight: 180, marginBottom: spacing.m },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    marginBottom: 2,
  },
  contactRowSelected: { backgroundColor: 'rgba(0,229,255,0.08)' },
  contactName: {
    flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '500', marginLeft: spacing.s,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4B5563',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  modalActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  btn: {
    backgroundColor: '#00E5FF', paddingHorizontal: spacing.xl, paddingVertical: spacing.m,
    borderRadius: 12, marginLeft: spacing.m, minWidth: 80, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#080E1A', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4B5563' },
  btnSecondaryText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  // Viewer
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.l, paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: spacing.m,
  },
  viewerUserInfo: { flex: 1, marginLeft: spacing.m },
  viewerUserName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  viewerUserTime: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  viewerCloseBtn: { padding: spacing.xs },
  viewerContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.l,
  },
  viewerImage: { width: '100%', height: '100%' },
  viewerTextBg: {
    backgroundColor: '#1E293B', borderRadius: 20, padding: spacing.xxl,
    width: '100%', alignItems: 'center',
  },
  viewerTextContent: {
    color: '#FFF', fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 28,
  },
  viewerReplyContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.l, paddingBottom: Platform.OS === 'ios' ? 24 : spacing.m,
    gap: spacing.s,
  },
  viewerReplyInput: {
    flex: 1, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.l, color: '#FFF', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  viewerReplySendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#00E5FF', justifyContent: 'center', alignItems: 'center',
  },
}));

export default StatusScreen;
