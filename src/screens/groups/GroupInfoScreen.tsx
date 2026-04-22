import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  FlatList
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import { useAppSelector } from '@store/hooks';

type GroupInfoRouteProp = RouteProp<ChatStackParamList, 'GroupInfo'>;

const MemberItem = ({ uid, chat }: { uid: string; chat: any }) => (
  <View style={styles.memberItem}>
    <Avatar size={40} name={`User ${uid.substring(0, 4)}`} />
    <Text style={styles.memberName}>User {uid.substring(0, 4)}</Text>
    {chat?.admins?.[uid] && <Text style={styles.adminBadge}>Admin</Text>}
  </View>
);

const GroupInfoScreen = () => {
  const route = useRoute<GroupInfoRouteProp>();
  const { chatId } = route.params;
  const chat = useAppSelector(state => state.chats.entities[chatId]);

  const renderItem = React.useCallback(
    ({ item }: { item: string }) => <MemberItem uid={item} chat={chat} />,
    [chat]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar uri={chat?.avatarUrl} name={chat?.name || 'Group'} size={100} />
        <Text style={styles.groupName}>{chat?.name || 'Group Name'}</Text>
        <Text style={styles.groupMeta}>Group • {chat?.members.length} Members</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{chat?.members.length} Participants</Text>
      </View>

      <FlatList
        data={chat?.members || []}
        renderItem={renderItem}
        keyExtractor={(item) => item}
      />

      <TouchableOpacity style={styles.leaveButton}>
        <Icon name="log-out-outline" size={24} color={colors.error} />
        <Text style={styles.leaveText}>Exit Group</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.secondaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  groupName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxlarge,
    fontWeight: 'bold',
    marginTop: spacing.m,
  },
  groupMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    padding: spacing.l,
    backgroundColor: colors.primaryBackground,
  },
  sectionTitle: {
    color: colors.primaryAccent,
    fontWeight: 'bold',
    fontSize: 14,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.secondaryBackground,
    marginBottom: 1,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    marginLeft: spacing.m,
    flex: 1,
  },
  adminBadge: {
    color: colors.primaryAccent,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.secondaryBackground,
    marginTop: spacing.xl,
  },
  leaveText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: spacing.m,
  },
});

export default GroupInfoScreen;
