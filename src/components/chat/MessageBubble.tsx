import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { formatMessageTime } from '@utils/dateUtils';
import MessageStatus from './MessageStatus';
import { useAppSelector } from '@store/hooks';
import { userSelectors } from '@store/slices/userSlice';
import Avatar from '@components/common/Avatar';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onLongPress?: (message: Message) => void;
  onPressImage?: (uri: string) => void;
}

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
  const colors = useThemeColors();
  const hasMedia = !!message.mediaUrl;
  const isImage = message.mediaType === 'image';
  const isVideo = message.mediaType === 'video';
  const isGif = message.mediaType === 'gif';
  const isSticker = message.mediaType === 'sticker';
  const isAudio = message.mediaType === 'audio';
  const isVisualMedia = isGif || isSticker;

  // Look up sender's info in Redux store
  const sender = useAppSelector(state => userSelectors.selectById(state, message.senderId));

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
        {!isMine && (
          <View style={styles.avatarContainer}>
            <Avatar uri={sender?.avatarUrl} name={sender?.displayName || 'User'} size={32} />
          </View>
        )}
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

          <View style={styles.stickerFooter}>
            {message.isPinned && (
              <Icon name="pin" size={10} color={colors.textTertiary} style={{ marginRight: 2 }} />
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
      {!isMine && (
        <View style={styles.avatarContainer}>
          <Avatar uri={sender?.avatarUrl} name={sender?.displayName || 'User'} size={36} />
        </View>
      )}
      
      <TouchableOpacity 
        activeOpacity={0.95}
        onLongPress={() => onLongPress?.(message)}
        disabled={!onLongPress}
        style={[
          styles.bubble, 
          isMine ? styles.mineBubble : styles.otherBubble,
          isImage && styles.imageBubble,
          isAudio && styles.audioBubble
        ]}
      >
        {/* Reply preview */}
        {message.replyTo && (
          <View style={[styles.replyContainer, isMine ? styles.replyMine : styles.replyOther]}>
            <Text style={[styles.replyText, isMine && styles.replyTextMine]} numberOfLines={1}>
              Replying to a message…
            </Text>
          </View>
        )}

        {/* Image Message Layout with Bottom Details Panel */}
        {hasMedia && isImage && (
          <View style={styles.imageLayout}>
            <TouchableOpacity onPress={handlePressImage} activeOpacity={0.85}>
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View style={styles.imagePanel}>
              <View style={styles.imageInfo}>
                <Text style={styles.imageTitle} numberOfLines={1}>
                  {getFileName(message)}
                </Text>
                <Text style={styles.imageSubtitle}>
                  {message.mediaSize ? `${formatFileSize(message.mediaSize)} • ` : ''}PNG Image
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadCircle} onPress={openUrl} activeOpacity={0.7}>
                <Icon name="download-outline" size={16} color="#080E1A" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Premium Waveform Audio Message Layout */}
        {hasMedia && isAudio && (
          <View style={styles.audioLayout}>
            <TouchableOpacity 
              style={[styles.playCircle, isMine ? styles.playCircleMine : styles.playCircleOther]} 
              onPress={openUrl} 
              activeOpacity={0.7}
            >
              <Icon name="play" size={16} color={isMine ? '#00E5FF' : '#080E1A'} style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
              {[8, 14, 20, 12, 16, 24, 18, 10, 16, 22, 14, 8, 12, 18, 14, 10, 16, 20, 12, 8].map((barHeight, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.waveformBar, 
                    { 
                      height: barHeight, 
                      backgroundColor: isMine 
                        ? (idx < 12 ? '#080E1A' : 'rgba(8,14,26,0.25)') 
                        : (idx < 8 ? '#00E5FF' : 'rgba(255,255,255,0.25)') 
                    }
                  ]} 
                />
              ))}
            </View>

            <Text style={[styles.audioDuration, isMine && styles.audioDurationMine]}>0:14</Text>
          </View>
        )}

        {/* Video pill */}
        {hasMedia && isVideo && (
          <TouchableOpacity style={styles.mediaPill} onPress={openUrl} activeOpacity={0.8}>
            <Icon name="videocam" size={18} color={isMine ? '#080E1A' : colors.textPrimary} />
            <Text style={[styles.mediaPillText, isMine && styles.mediaPillTextMine]} numberOfLines={1}>Video</Text>
            <Icon name="open-outline" size={13} color={isMine ? 'rgba(8,14,26,0.6)' : colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Other generic file pill */}
        {hasMedia && !isImage && !isVideo && !isAudio && (
          <TouchableOpacity style={styles.mediaPill} onPress={openUrl} activeOpacity={0.8}>
            <Icon
              name="document-text"
              size={18}
              color={isMine ? '#080E1A' : colors.textPrimary}
            />
            <Text style={[styles.mediaPillText, isMine && styles.mediaPillTextMine]} numberOfLines={1}>
              {getFileName(message)} {message.mediaSize ? `(${formatFileSize(message.mediaSize)})` : ''}
            </Text>
            <Icon name="open-outline" size={13} color={isMine ? 'rgba(8,14,26,0.6)' : colors.textTertiary} />
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
            <Icon 
              name="pin" 
              size={10} 
              color={isMine ? 'rgba(8,14,26,0.5)' : colors.textTertiary} 
              style={{ marginRight: 2 }} 
            />
          )}
          {message.isEdited && (
            <Text style={[styles.time, isMine ? styles.mineTime : styles.otherTime, { fontStyle: 'italic', marginRight: 2 }]}>
              edited
            </Text>
          )}
          <Text style={[styles.time, isMine ? styles.mineTime : styles.otherTime]}>
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

const styles = createThemedStyles((colors) => ({
  container: {
    marginVertical: 4,
    paddingHorizontal: spacing.m,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mineContainer: { 
    justifyContent: 'flex-end',
  },
  otherContainer: { 
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: spacing.s,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mineBubble: {
    backgroundColor: '#00E5FF', // Sleek Cyan
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1E293B', // Slate Dark
    borderBottomLeftRadius: 4,
  },
  imageBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  audioBubble: {
    paddingVertical: spacing.m,
    minWidth: 230,
  },
  // ── Image Layout ──
  imageLayout: {
    width: 240,
  },
  mediaImage: {
    width: '100%',
    height: 180,
  },
  imagePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    backgroundColor: '#0F172A',
  },
  imageInfo: {
    flex: 1,
    marginRight: spacing.m,
  },
  imageTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  imageSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  downloadCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Audio Waveform Layout ──
  audioLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircleMine: {
    backgroundColor: '#080E1A',
  },
  playCircleOther: {
    backgroundColor: '#00E5FF',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 28,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.25,
  },
  audioDuration: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  audioDurationMine: {
    color: '#080E1A',
  },
  // ── Media Pill ──
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    padding: spacing.m,
    marginBottom: spacing.xs,
    gap: spacing.s,
  },
  mediaPillText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  mediaPillTextMine: {
    color: '#080E1A',
  },
  // ── GIF / Sticker (no bubble) ──
  stickerWrapper: {
    maxWidth: '65%',
  },
  gifImage: {
    width: 200,
    height: 160,
    borderRadius: 16,
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
    color: colors.textTertiary,
  },
  // ── Text ──
  text: {
    fontSize: typography.fontSize.regular,
    lineHeight: typography.lineHeight.regular,
  },
  mineText: { 
    color: '#080E1A',
    fontWeight: '500',
  },
  otherText: { 
    color: colors.textPrimary,
  },
  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  time: {
    fontSize: 10,
  },
  mineTime: {
    color: 'rgba(8,14,26,0.6)',
  },
  otherTime: {
    color: colors.textTertiary,
  },
  status: { marginLeft: 1 },
  // ── Reply ──
  replyContainer: {
    borderLeftWidth: 2,
    padding: spacing.xs,
    paddingLeft: spacing.s,
    marginBottom: spacing.s,
    borderRadius: 4,
  },
  replyMine: {
    backgroundColor: 'rgba(8,14,26,0.06)',
    borderLeftColor: '#080E1A',
  },
  replyOther: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderLeftColor: colors.primaryAccent,
  },
  replyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  replyTextMine: {
    color: 'rgba(8,14,26,0.7)',
  },
}));

export default React.memo(MessageBubble);
