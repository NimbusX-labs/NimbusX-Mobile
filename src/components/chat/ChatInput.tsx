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
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import EmojiGifPicker from './EmojiGifPicker';
import { TenorMedia } from '@services/tenorService';

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

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping, onSendMedia, onSendGif, onSendSticker }) => {
  const [text, setText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStartTab, setPickerStartTab] = useState<PickerStartTab>('emoji');
  const inputRef = useRef<TextInput>(null);

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

  // ── Open sticker picker directly (sticker icon in the field) ────────────────
  const openStickerPicker = useCallback(() => {
    if (pickerOpen && pickerStartTab === 'sticker') {
      setPickerOpen(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setPickerStartTab('sticker');
      setTimeout(() => setPickerOpen(true), 80);
    }
  }, [pickerOpen, pickerStartTab]);

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
  const handleMedia = async (result: AttachmentResult) => {
    if (!onSendMedia) {
      Alert.alert('Not supported', 'Media sending is not wired up in this chat.');
      return;
    }
    try {
      setUploading(true);
      await onSendMedia(result);
    } catch (err) {
      Alert.alert('Upload failed', 'Could not send the file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
  }, [onSendMedia]);

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
      label: 'Document',
      icon: 'document-text',
      iconColor: '#fff',
      bgColor: '#3B82F6',
      action: () => {
        closeMenu();
        Alert.alert('Documents', 'Document picking requires react-native-document-picker. Coming soon!');
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
          const res = await launchImageLibrary({ mediaType: 'mixed' as MediaType });
          if (res.didCancel || !res.assets?.length) return;
          const asset = res.assets[0];
          handleMedia({
            uri: asset.uri!,
            type: 'audio',
            fileName: asset.fileName,
            mimeType: asset.type,
          });
        }, 300);
      },
    },
  ];

  // ── Text send ───────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
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
          INPUT BAR — WhatsApp style:
          ┌──────────────────────────────────────────┐  ┌─────┐
          │ 😊  Message              📎   🏷   📷   │  │ 🎤  │
          └──────────────────────────────────────────┘  └─────┘
          ═══════════════════════════════════════════════════════════════════ */}
      <View style={styles.inputBar}>
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

          {/* 📎 Attach — right cluster */}
          <TouchableOpacity
            onPress={openMenu}
            style={styles.fieldIcon}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primaryAccent} />
            ) : (
              <Icon name="attach" size={22} color={colors.textSecondary} style={{ transform: [{ rotate: '-45deg' }] }} />
            )}
          </TouchableOpacity>

          {/* 🏷️ Sticker shortcut */}
          <TouchableOpacity
            onPress={openStickerPicker}
            style={styles.fieldIcon}
            hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          >
            <Icon
              name={pickerOpen && pickerStartTab === 'sticker' ? 'keypad-outline' : 'pricetag-outline'}
              size={20}
              color={pickerOpen && pickerStartTab === 'sticker' ? colors.primaryAccent : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* 📷 Camera shortcut */}
          <TouchableOpacity
            onPress={quickCamera}
            style={[styles.fieldIcon, { marginRight: 2 }]}
            hitSlop={{ top: 8, bottom: 8, left: 2, right: 8 }}
          >
            <Icon name="camera-outline" size={21} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 🎤 / ➤  Send or Mic — circular outside */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={hasText ? handleSend : undefined}
          activeOpacity={hasText ? 0.7 : 1}
        >
          <Icon
            name={hasText ? 'send' : 'mic'}
            size={22}
            color={colors.white}
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
const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 5,
    backgroundColor: colors.primaryBackground,
    gap: 5,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 24,
    paddingLeft: 4,
    paddingRight: 2,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
    minHeight: 46,
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
    paddingHorizontal: 2,
    maxHeight: 100,
  },
  actionButton: {
    backgroundColor: colors.primaryAccent,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#1E2D3D',
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
    color: '#E7E9EA',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ChatInput;
