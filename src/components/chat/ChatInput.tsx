import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  Modal,
  Animated,
  Pressable,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  launchImageLibrary,
  launchCamera,
  MediaType,
} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import EmojiGifPicker from './EmojiGifPicker';
import { TenorMedia } from '@services/tenorService';
import { Message } from '@types';

interface AttachmentResult {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  mimeType?: string;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onSendMedia?: (attachment: AttachmentResult) => Promise<void>;
  onSendGif?: (gif: TenorMedia) => void;
  onSendSticker?: (sticker: TenorMedia) => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (text: string) => void;
}

type AttachOption = {
  label: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  action: () => void;
};

// The default picker tab when opened via the sticker shortcut icon
type PickerStartTab = 'emoji' | 'sticker';

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  onSendMedia,
  onSendGif,
  onSendSticker,
  editingMessage = null,
  onCancelEdit,
  onSaveEdit,
}) => {
  const colors = useThemeColors();
  const [text, setText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStartTab, setPickerStartTab] = useState<PickerStartTab>('emoji');
  const inputRef = useRef<TextInput>(null);

  // ── Populate input when editingMessage changes ──────────────────────────────
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setText('');
    }
  }, [editingMessage]);

  const menuAnim = useRef(new Animated.Value(0)).current;

  // ── Track keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {},
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {},
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ── Toggle emoji picker (left icon) ─────────────────────────────────────────
  const toggleEmojiPicker = useCallback(() => {
    if (pickerOpen) {
      setPickerOpen(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setPickerStartTab('emoji');
      setTimeout(() => setPickerOpen(true), 80);
    }
  }, [pickerOpen]);


  // ── When input is focused, close picker ─────────────────────────────────────
  const handleInputFocus = useCallback(() => {
    if (pickerOpen) setPickerOpen(false);
  }, [pickerOpen]);

  // ── Emoji insert ────────────────────────────────────────────────────────────
  const handleEmojiSelect = useCallback((emoji: string) => {
    setText(prev => prev + emoji);
    onTyping(true);
  }, [onTyping]);

  // ── GIF send ────────────────────────────────────────────────────────────────
  const handleGifSelect = useCallback((gif: TenorMedia) => {
    setPickerOpen(false);
    onSendGif ? onSendGif(gif) : onSend(`[GIF] ${gif.url}`);
  }, [onSendGif, onSend]);

  // ── Sticker send ────────────────────────────────────────────────────────────
  const handleStickerSelect = useCallback((sticker: TenorMedia) => {
    setPickerOpen(false);
    onSendSticker ? onSendSticker(sticker) : onSend(`[Sticker] ${sticker.url}`);
  }, [onSendSticker, onSend]);

  // ── Attachment menu ─────────────────────────────────────────────────────────
  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1, useNativeDriver: true, tension: 60, friction: 8,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  // ── Media upload ────────────────────────────────────────────────────────────
  const handleMedia = useCallback(async (result: AttachmentResult) => {
    if (!onSendMedia) {
      Alert.alert('Not supported', 'Media sending is not wired up in this chat.');
      return;
    }
    try {
      setUploading(true);
      await onSendMedia(result);
    } catch (err) {
      console.error('Media send error:', err);
      Alert.alert('Send failed', 'Could not send the file. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onSendMedia]);

  // ── Quick camera (no menu) ──────────────────────────────────────────────────
  const quickCamera = useCallback(async () => {
    const res = await launchCamera({
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      saveToPhotos: false,
    });
    if (res.didCancel || !res.assets?.length) return;
    const asset = res.assets[0];
    handleMedia({
      uri: asset.uri!,
      type: 'image',
      fileName: asset.fileName,
      mimeType: asset.type,
    });
  }, [handleMedia]);

  // ── Attachment options ──────────────────────────────────────────────────────
  const attachOptions: AttachOption[] = [
    {
      label: 'Photos & Videos',
      icon: 'images',
      iconColor: '#fff',
      bgColor: '#8B5CF6',
      action: async () => {
        closeMenu();
        setTimeout(async () => {
          const res = await launchImageLibrary({
            mediaType: 'mixed' as MediaType,
            quality: 0.8,
            videoQuality: 'medium',
          });
          if (res.didCancel || !res.assets?.length) return;
          const asset = res.assets[0];
          const isVideo = asset.type?.startsWith('video');
          handleMedia({
            uri: asset.uri!,
            type: isVideo ? 'video' : 'image',
            fileName: asset.fileName,
            mimeType: asset.type,
          });
        }, 300);
      },
    },
    {
      label: 'Camera',
      icon: 'camera',
      iconColor: '#fff',
      bgColor: '#EF4444',
      action: async () => {
        closeMenu();
        setTimeout(() => quickCamera(), 300);
      },
    },
    {
      label: 'File',
      icon: 'document-text',
      iconColor: '#fff',
      bgColor: '#3B82F6',
      action: () => {
        closeMenu();
        setTimeout(async () => {
          try {
            const res = await DocumentPicker.pick({
              type: [DocumentPicker.types.allFiles],
              copyTo: 'cachesDirectory',
            });
            const asset = res[0];
            handleMedia({
              uri: asset.fileCopyUri || asset.uri,
              type: 'file',
              fileName: asset.name || undefined,
              mimeType: asset.type || undefined,
            });
          } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
              console.error('Document picker error:', err);
              Alert.alert('Error', 'Failed to pick file.');
            }
          }
        }, 300);
      },
    },
    {
      label: 'Audio',
      icon: 'headset',
      iconColor: '#fff',
      bgColor: '#F59E0B',
      action: async () => {
        closeMenu();
        setTimeout(async () => {
          try {
            const res = await DocumentPicker.pick({
              type: [DocumentPicker.types.audio],
              copyTo: 'cachesDirectory',
            });
            const asset = res[0];
            handleMedia({
              uri: asset.fileCopyUri || asset.uri,
              type: 'audio',
              fileName: asset.name || undefined,
              mimeType: asset.type || undefined,
            });
          } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
              console.error('Audio picker error:', err);
              Alert.alert('Error', 'Failed to pick audio file.');
            }
          }
        }, 300);
      },
    },
  ];

  // ── Attachment options ──────────────────────────────────────────────────────
  const handleSend = () => {
    if (text.trim()) {
      if (editingMessage && onSaveEdit) {
        onSaveEdit(text.trim());
      } else {
        onSend(text.trim());
      }
      setText('');
      onTyping(false);
    }
  };

  const handleChangeText = (val: string) => {
    setText(val);
    onTyping(val.length > 0);
  };

  // ── Animations ──────────────────────────────────────────────────────────────
  const menuTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const menuOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const hasText = text.trim().length > 0;

  return (
    <>
      {/* ── Attachment menu modal ──────────────────────────────────────────── */}
      {menuVisible && (
        <Modal transparent animationType="none" onRequestClose={closeMenu}>
          <Pressable style={styles.overlay} onPress={closeMenu}>
            <Animated.View
              style={[
                styles.attachMenu,
                { opacity: menuOpacity, transform: [{ translateY: menuTranslateY }] },
              ]}
            >
              {attachOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.attachRow}
                  onPress={opt.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.attachIcon, { backgroundColor: opt.bgColor }]}>
                    <Icon name={opt.icon} size={20} color={opt.iconColor} />
                  </View>
                  <Text style={styles.attachLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          INPUT BAR — Modern Design with external Plus button:
          ＋ ┌───────────────────────────┐  ┌───┐
             │ 😊  Message            📄  │  │ 🎤│
             └───────────────────────────┘  └───┘
          ═══════════════════════════════════════════════════════════════════ */}
      {editingMessage && (
        <View style={styles.editBanner}>
          <View style={styles.editInfo}>
            <Icon name="pencil" size={16} color={colors.primaryAccent} />
            <View style={styles.editTextContainer}>
              <Text style={styles.editLabel}>Editing message</Text>
              <Text style={styles.editText} numberOfLines={1}>
                {editingMessage.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onCancelEdit} style={styles.editCloseButton}>
            <Icon name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        {/* Plus Button outside on the left */}
        <TouchableOpacity
          onPress={openMenu}
          style={styles.plusButton}
          activeOpacity={0.7}
        >
          <Icon name="add" size={26} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          {/* 😊 Emoji toggle — left edge */}
          <TouchableOpacity
            onPress={toggleEmojiPicker}
            style={styles.fieldIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          >
            <Icon
              name={pickerOpen && pickerStartTab === 'emoji' ? 'keypad-outline' : 'happy-outline'}
              size={24}
              color={pickerOpen && pickerStartTab === 'emoji' ? colors.primaryAccent : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={handleChangeText}
            onFocus={handleInputFocus}
            multiline
          />

          {/* Document icon removed */}
        </View>

        {/* 🎤 / ➤ Send or Mic — circular outside */}
        <TouchableOpacity
          style={[styles.actionButton, !hasText && styles.actionButtonMic]}
          onPress={hasText ? handleSend : undefined}
          activeOpacity={hasText ? 0.7 : 1}
        >
          <Icon
            name={editingMessage ? 'checkmark' : (hasText ? 'send' : 'mic')}
            size={hasText ? 20 : 22}
            color={hasText ? '#080E1A' : colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* ── Picker panel (replaces keyboard) ───────────────────────────────── */}
      <EmojiGifPicker
        visible={pickerOpen}
        startTab={pickerStartTab}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onStickerSelect={handleStickerSelect}
      />
    </>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const styles = createThemedStyles((colors) => ({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.primaryBackground,
    gap: 8,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 1 : 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#111827', // Match dark slate
    borderRadius: 24,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  fieldIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 2 : 3,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 9 : 8,
    paddingBottom: Platform.OS === 'ios' ? 9 : 8,
    paddingHorizontal: 4,
    maxHeight: 100,
  },
  actionButton: {
    backgroundColor: '#00E5FF', // Sleek Cyan
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 1 : 2,
  },
  actionButtonMic: {
    backgroundColor: '#1E293B', // Slate Dark
  },
  // ── Overlay ──
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingBottom: 80,
  },
  // ── Attach menu ──
  attachMenu: {
    marginHorizontal: spacing.l,
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    paddingVertical: spacing.s,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  attachIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  attachLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  // ── Edit message banner ──
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryAccent,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  editInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editTextContainer: {
    marginLeft: spacing.s,
    flex: 1,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primaryAccent,
  },
  editText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editCloseButton: {
    padding: spacing.xs,
  },
}));

export default ChatInput;
