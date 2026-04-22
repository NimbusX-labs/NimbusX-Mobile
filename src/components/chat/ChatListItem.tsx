import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Chat, User } from '@types';
import { firestoreService } from '@services/firebase/firestore';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import Badge from '@components/common/Badge';

interface ChatListItemProps {
  chat: Chat;
  onPress: (otherUserName?: string) => void;
  currentUserId: string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress, currentUserId }) => {
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    if (chat.type !== 'group') {
      const otherId = chat.members?.find(id => id !== currentUserId);
      if (otherId) {
        firestoreService.getUser(otherId).then(user => {
          if (user) {
            setOtherUser(user);
          }
        }).catch(err => console.warn('Failed to fetch other user profile:', err));
      }
    }
  }, [chat.members, chat.type, currentUserId]);

  const getDisplayName = () => {
    if (chat.type === 'group') return chat.name || 'Group';
    if (otherUser?.displayName) return otherUser.displayName;
    if (otherUser?.email) return otherUser.email;
    const otherId = chat.members?.find(id => id !== currentUserId);
    return chat.name || `User ${otherId?.substring(0, 4) || '...'}`;
  };

  const getAvatarUrl = () => {
    if (chat.type === 'group') return chat.avatarUrl;
    return otherUser?.avatarUrl || chat.avatarUrl;
  };

  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl();

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(displayName)}>
      <Avatar uri={avatarUrl} name={displayName} size={55} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.time}>{formatTime(chat.lastMessageAt)}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessageSenderId === currentUserId ? 'You: ' : ''}
            {chat.lastMessage || 'No messages yet'}
          </Text>
          <Badge count={unreadCount} size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.l,
    alignItems: 'center',
    backgroundColor: colors.primaryBackground,
  },
  content: {
    flex: 1,
    marginLeft: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.m,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
    flex: 1,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.tiny,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    flex: 1,
    marginRight: spacing.s,
  },
});

export default React.memo(ChatListItem);
