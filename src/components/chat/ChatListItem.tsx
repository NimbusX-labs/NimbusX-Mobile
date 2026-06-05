import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Chat, User } from '@types';
import { firestoreService } from '@services/supabase/database';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import Badge from '@components/common/Badge';
import { useAppDispatch } from '@store/hooks';
import { upsertUser } from '@store/slices/userSlice';

interface ChatListItemProps {
  chat: Chat;
  onPress: (otherUserName?: string, otherUserAvatar?: string) => void;
  currentUserId: string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress, currentUserId }) => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    if (chat.type !== 'group') {
      const otherId = chat.members?.find(id => id !== currentUserId);
      if (otherId) {
        firestoreService.getUser(otherId).then(user => {
          if (user) {
            setOtherUser(user);
            dispatch(upsertUser(user));
          }
        }).catch(err => console.warn('Failed to fetch other user profile:', err));
      }
    }
  }, [chat.members, chat.type, currentUserId, dispatch]);

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
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(displayName, avatarUrl)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarContainer, unreadCount > 0 && styles.avatarUnreadGlow]}>
        <Avatar uri={avatarUrl} name={displayName} size={52} />
        {chat.type === 'group' && (
          <View style={styles.groupBadge}>
            <Text style={{ color: colors.white, fontSize: 10 }}>👥</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, unreadCount > 0 && styles.nameUnread]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>{formatTime(chat.lastMessageAt)}</Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessageSenderId === currentUserId ? 'You: ' : ''}
            {chat.lastMessage || 'No messages yet...'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badgeWrapper}>
              <Badge count={unreadCount} size={22} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: spacing.m,
    marginBottom: spacing.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.m,
    padding: 2,
    borderRadius: 30,
  },
  avatarUnreadGlow: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: colors.primaryAccent,
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.s,
    letterSpacing: 0.3,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  timeUnread: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    marginRight: spacing.m,
  },
  lastMessageUnread: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  badgeWrapper: {
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
}));

export default React.memo(ChatListItem);
