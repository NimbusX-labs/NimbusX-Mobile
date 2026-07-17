import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useAppSelector } from '@store/hooks';
import { chatSelectors } from '@store/slices/chatSlice';
import { useChats } from '@hooks/useChats';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

import ChatListItem from '@components/chat/ChatListItem';

type NavigationProp = StackNavigationProp<ChatStackParamList>;

const GroupsScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector((state) => state.auth.user);
  const chats = useAppSelector(chatSelectors.selectAll);
  const { loading, error } = useChats();

  const groups = useMemo(() => chats.filter((c) => c.type === 'group'), [chats]);

  const openGroup = useCallback(
    (chatId: string, groupName: string, groupAvatar?: string) => {
      navigation.navigate('GroupChat', { chatId, groupName, groupAvatar });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof groups)[number] }) => (
      <ChatListItem
        chat={item}
        onPress={() => openGroup(item.id, item.name || 'Group', item.avatarUrl)}
        currentUserId={user?.uid || ''}
      />
    ),
    [openGroup, user?.uid]
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            error ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="cloud-offline-outline" size={48} color={colors.error} />
                </View>
                <Text style={styles.emptyTitle}>Connection issue</Text>
                <Text style={styles.emptyText}>
                  Could not load groups. Check your connection and pull down to retry.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="people-outline" size={48} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Create a group to start chatting with multiple people.
                </Text>
              </View>
            )
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  listContent: {
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    marginTop: spacing.s,
    textAlign: 'center',
    lineHeight: typography.lineHeight.regular,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    backgroundColor: colors.primaryAccent,
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
}));

export default GroupsScreen;
