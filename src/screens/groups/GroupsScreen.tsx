import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
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
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

import ChatListItem from '@components/chat/ChatListItem';

type NavigationProp = StackNavigationProp<ChatStackParamList>;

const GroupsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector((state) => state.auth.user);
  const chats = useAppSelector(chatSelectors.selectAll);
  const { loading } = useChats();

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
            <View style={styles.empty}>
              <Icon name="people-outline" size={80} color={colors.divider} />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create a group to start chatting with multiple people.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <Icon name="people" size={28} color={colors.white} />
        <Text style={styles.fabText}>Create Group</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  listContent: {
    paddingBottom: 120,
  },
  empty: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
    marginTop: spacing.l,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.medium,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxl,
    backgroundColor: colors.primaryAccent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    height: 56,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.m,
    fontSize: typography.fontSize.medium,
  },
});

export default GroupsScreen;
