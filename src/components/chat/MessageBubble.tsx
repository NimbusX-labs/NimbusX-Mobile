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
}

const MEDIA_ICON: Record<string, string> = {
  audio: 'musical-notes',
  video: 'videocam',
  file: 'document-text',
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const hasMedia = !!message.mediaUrl;
  const isImage = message.mediaType === 'image';
  const isVideo = message.mediaType === 'video';

  const openUrl = () => {
    if (message.mediaUrl) {
      Linking.openURL(message.mediaUrl).catch(console.error);
    }
  };

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isMine ? styles.mineBubble : styles.otherBubble]}>

        {/* Reply preview */}
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={1}>Replying to a message…</Text>
          </View>
        )}

        {/* Image */}
        {hasMedia && isImage && (
          <TouchableOpacity onPress={openUrl} activeOpacity={0.85}>
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
              {message.mediaType === 'audio' ? 'Audio file' : 'File'}
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
          {message.storageMode === 'local' && (
            <Icon 
              name="cloud-offline-outline" 
              size={12} 
              color={isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary} 
              style={{ marginRight: 4 }}
            />
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
      </View>
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
    marginTop: spacing.xxs,
  },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: colors.textSecondary,
  },
  status: { marginLeft: spacing.xs },
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
