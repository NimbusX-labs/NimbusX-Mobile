import React, { useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Text 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '@store/hooks';
import { chatSelectors } from '@store/slices/chatSlice';
import { useChats } from '@hooks/useChats';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

// Components
import ChatListItem from '@components/chat/ChatListItem';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'MainTabs'>;

const ChatListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const chats = useAppSelector(chatSelectors.selectAll);
  const user = useAppSelector((state) => state.auth.user);
  
  // Use custom hook for fetching and subscriptions
  const { loading } = useChats();

  const handlePress = useCallback((chat: any, resolvedName?: string) => {
    if (chat.type === 'group') {
      navigation.navigate('GroupChat', { 
        chatId: chat.id, 
        groupName: chat.name || 'Group' 
      });
    } else {
      const otherId = chat.members?.find((id: string) => id !== user?.uid);
      const otherUserName = resolvedName || chat.name || `User ${otherId?.substring(0, 4) || '...'}`;
      navigation.navigate('Chat', { 
        chatId: chat.id,
        otherUserName
      });
    }
  }, [navigation, user?.uid]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ChatListItem 
      chat={item} 
      onPress={(resolvedName) => handlePress(item, resolvedName)}
      currentUserId={user?.uid || ''}
    />
  ), [handlePress, user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Icon name="chatbubbles-outline" size={80} color={colors.divider} />
              <Text style={styles.emptyText}>No chats yet. Start a new one!</Text>
            </View>
          ) : null
        }
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('NewChat')}
      >
        <Icon name="chatbubble-ellipses" size={30} color={colors.white} />
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
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    backgroundColor: colors.primaryAccent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  empty: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.medium,
    marginTop: spacing.xl,
  },
});

export default ChatListScreen;
