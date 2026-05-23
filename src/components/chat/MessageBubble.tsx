import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { formatMessageTime } from '@utils/dateUtils';
import MessageStatus from './MessageStatus';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onLongPress?: (message: Message) => void;
  onPressImage?: (uri: string) => void;
}

const MEDIA_ICON: Record<string, string> = {
  audio: 'musical-notes',
  video: 'videocam',
  file: 'document-text',
};

const getFileName = (message: Message) => {
  if (message.mediaPath) {
    const parts = message.mediaPath.split('/');
    return parts[parts.length - 1];
  }
  if (message.mediaUrl) {
    try {
      const decodedUrl = decodeURIComponent(message.mediaUrl);
      const urlParts = decodedUrl.split('?')[0].split('/');
      return urlParts[urlParts.length - 1];
    } catch {
      // ignore
    }
  }
  return message.mediaType === 'audio' ? 'Audio file' : 'File';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine, onLongPress, onPressImage }) => {
  const hasMedia = !!message.mediaUrl;
  const isImage = message.mediaType === 'image';
  const isVideo = message.mediaType === 'video';
  const isGif = message.mediaType === 'gif';
  const isSticker = message.mediaType === 'sticker';
  const isVisualMedia = isGif || isSticker;

  const openUrl = () => {
    if (message.mediaUrl) {
      Linking.openURL(message.mediaUrl).catch(console.error);
    }
  };

  const handlePressImage = () => {
    if (isImage && message.mediaUrl && onPressImage) {
      onPressImage(message.mediaUrl);
    } else {
      openUrl();
    }
  };

  const handlePressVisual = () => {
    if (message.mediaUrl && onPressImage) {
      onPressImage(message.mediaUrl);
    } else {
      openUrl();
    }
  };

  // GIFs and stickers render without the colored bubble background
  if (hasMedia && isVisualMedia) {
    return (
      <View style={[styles.container, isMine ? styles.mineContainer : styles.otherContainer]}>
        <TouchableOpacity 
          activeOpacity={0.95}
          onLongPress={() => onLongPress?.(message)}
          disabled={!onLongPress}
          style={styles.stickerWrapper}
        >
          <TouchableOpacity onPress={handlePressVisual} activeOpacity={0.85}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={isSticker ? styles.stickerImage : styles.gifImage}
              resizeMode={isSticker ? 'contain' : 'cover'}
            />
          </TouchableOpacity>

          {/* Footer overlaid at bottom-right */}
          <View style={styles.stickerFooter}>
            {message.isPinned && (
              <Icon name="pin" size={10} color={colors.textSecondary} style={{ marginRight: 2 }} />
            )}
            {message.isEdited && (
              <Text style={[styles.stickerTime, { fontStyle: 'italic', marginRight: 2 }]}>
                edited
              </Text>
            )}
            <Text style={styles.stickerTime}>{formatMessageTime(message.createdAt)}</Text>
            {isMine && (
              <View style={styles.status}>
                <MessageStatus status={message.status} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.otherContainer]}>
      <TouchableOpacity 
        activeOpacity={0.95}
        onLongPress={() => onLongPress?.(message)}
        disabled={!onLongPress}
        style={[styles.bubble, isMine ? styles.mineBubble : styles.otherBubble]}
      >

        {/* Reply preview */}
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={1}>Replying to a message…</Text>
          </View>
        )}

        {/* Image */}
        {hasMedia && isImage && (
          <TouchableOpacity onPress={handlePressImage} activeOpacity={0.85}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Video pill */}
        {hasMedia && isVideo && (
          <TouchableOpacity style={styles.mediaPill} onPress={openUrl} activeOpacity={0.8}>
            <Icon name="videocam" size={20} color="#fff" />
            <Text style={styles.mediaPillText} numberOfLines={1}>Video</Text>
            <Icon name="open-outline" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {/* Audio / file pill */}
        {hasMedia && !isImage && !isVideo && (
          <TouchableOpacity style={styles.mediaPill} onPress={openUrl} activeOpacity={0.8}>
            <Icon
              name={MEDIA_ICON[message.mediaType || 'file'] || 'document-text'}
              size={20}
              color="#fff"
            />
            <Text style={styles.mediaPillText} numberOfLines={1}>
              {getFileName(message)} {message.mediaSize ? `(${formatFileSize(message.mediaSize)})` : ''}
            </Text>
            <Icon name="open-outline" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {/* Text body */}
        {!!message.text && (
          <Text style={[styles.text, isMine ? styles.mineText : styles.otherText]}>
            {message.text}
          </Text>
        )}

        {/* Timestamp + status */}
        <View style={styles.footer}>
          {message.isPinned && (
            <Icon name="pin" size={10} color={isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary} style={{ marginRight: 2 }} />
          )}
          {message.isEdited && (
            <Text style={[styles.time, !isMine && styles.otherTime, { fontStyle: 'italic', marginRight: 2 }]}>
              edited
            </Text>
          )}
          <Text style={[styles.time, !isMine && styles.otherTime]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {isMine && (
            <View style={styles.status}>
              <MessageStatus status={message.status} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.m,
  },
  mineContainer: { alignItems: 'flex-end' },
  otherContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    padding: spacing.s,
    borderRadius: spacing.m,
  },
  mineBubble: {
    backgroundColor: colors.primaryAccent,
    borderBottomRightRadius: spacing.xs,
  },
  otherBubble: {
    backgroundColor: colors.secondaryBackground,
    borderBottomLeftRadius: spacing.xs,
  },
  // ── Media ──
  mediaImage: {
    width: 220,
    height: 180,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: spacing.s,
    marginBottom: spacing.xs,
    gap: spacing.s,
  },
  mediaPillText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  // ── GIF / Sticker (no bubble) ──
  stickerWrapper: {
    maxWidth: '65%',
  },
  gifImage: {
    width: 200,
    height: 160,
    borderRadius: 12,
  },
  stickerImage: {
    width: 150,
    height: 150,
  },
  stickerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 2,
  },
  stickerTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  // ── Text ──
  text: {
    fontSize: typography.fontSize.regular,
    lineHeight: typography.lineHeight.regular,
  },
  mineText: { color: colors.white },
  otherText: { color: colors.textPrimary },
  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 2,
  },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: colors.textSecondary,
  },
  status: { marginLeft: 1 },
  // ── Reply ──
  replyContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.white,
    padding: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: 4,
  },
  replyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
});

export default React.memo(MessageBubble);
