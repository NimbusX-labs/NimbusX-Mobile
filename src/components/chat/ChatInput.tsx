import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  launchImageLibrary,
  launchCamera,
  MediaType,
} from 'react-native-image-picker';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

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
}

type AttachOption = {
  label: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  action: () => void;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping, onSendMedia }) => {
  const [text, setText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const menuAnim = useRef(new Animated.Value(0)).current;

  // ── Menu open/close ─────────────────────────────────────────────────────────
  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleMedia = async (result: AttachmentResult) => {
    closeMenu();
    if (!onSendMedia) {
      Alert.alert('Not supported', 'Media sending is not wired up in this chat.');
      return;
    }
    try {
      setUploading(true);
      await onSendMedia(result);
    } catch (err) {
      Alert.alert('Upload failed', 'Could not send the file. Please try again.');
      console.error('Media send error:', err);
    } finally {
      setUploading(false);
    }
  };

  // ── Attachment options ───────────────────────────────────────────────────────
  const attachOptions: AttachOption[] = [
    {
      label: 'Photos & Videos',
      icon: 'images',
      iconColor: '#fff',
      bgColor: '#8B5CF6',
      action: async () => {
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
      },
    },
    {
      label: 'Camera',
      icon: 'camera',
      iconColor: '#fff',
      bgColor: '#EF4444',
      action: async () => {
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
      },
    },
    {
      label: 'Document',
      icon: 'document-text',
      iconColor: '#fff',
      bgColor: '#3B82F6',
      action: () => {
        closeMenu();
        Alert.alert(
          'Documents',
          'Document picking requires react-native-document-picker. Coming soon!',
        );
      },
    },
    {
      label: 'Audio',
      icon: 'headset',
      iconColor: '#fff',
      bgColor: '#F59E0B',
      action: async () => {
        const res = await launchImageLibrary({
          mediaType: 'mixed' as MediaType,
        });
        if (res.didCancel || !res.assets?.length) return;
        const asset = res.assets[0];
        handleMedia({
          uri: asset.uri!,
          type: 'audio',
          fileName: asset.fileName,
          mimeType: asset.type,
        });
      },
    },
  ];

  // ── Text handlers ────────────────────────────────────────────────────────────
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

  // ── Animations ───────────────────────────────────────────────────────────────
  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const menuOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      {/* ── Attachment menu modal ─────────────────────────────────────────────── */}
      {menuVisible && (
        <Modal
          transparent
          animationType="none"
          onRequestClose={closeMenu}
        >
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

      {/* ── Input bar ─────────────────────────────────────────────────────────── */}
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primaryAccent} />
          ) : (
            <Icon name="add-circle" size={28} color={colors.primaryAccent} />
          )}
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="New message"
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={handleChangeText}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.disabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Icon name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // ── Input bar ──
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.s,
    backgroundColor: colors.primaryBackground,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  iconButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 20,
    marginHorizontal: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    minHeight: 40,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primaryAccent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  // ── Overlay ──
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingBottom: 80, // sits above the input bar
  },
  // ── Attach menu ──
  attachMenu: {
    marginHorizontal: spacing.l,
    backgroundColor: '#1E2D3D',
    borderRadius: 18,
    paddingVertical: spacing.s,
    // Shadow
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
