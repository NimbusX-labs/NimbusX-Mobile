import React, { useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Text,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '@store/hooks';
import { chatSelectors } from '@store/slices/chatSlice';
import { useChats } from '@hooks/useChats';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

// Components
import ChatListItem from '@components/chat/ChatListItem';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ChatStackParamList, 'MainTabs'>;

const ChatListScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NavigationProp>();
  const chats = useAppSelector(chatSelectors.selectAll);
  const user = useAppSelector((state) => state.auth.user);
  
  const { loading } = useChats();

  const handlePress = useCallback((chat: any, resolvedName?: string, resolvedAvatar?: string) => {
    if (chat.type === 'group') {
      navigation.navigate('GroupChat', { 
        chatId: chat.id, 
        groupName: chat.name || 'Group',
        groupAvatar: resolvedAvatar || chat.avatarUrl
      });
    } else {
      const otherId = chat.members?.find((id: string) => id !== user?.uid);
      const otherUserName = resolvedName || chat.name || `User ${otherId?.substring(0, 4) || '...'}`;
      navigation.navigate('Chat', { 
        chatId: chat.id,
        otherUserName,
        otherUserAvatar: resolvedAvatar
      });
    }
  }, [navigation, user?.uid]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ChatListItem 
      chat={item} 
      onPress={(resolvedName, resolvedAvatar) => handlePress(item, resolvedName, resolvedAvatar)}
      currentUserId={user?.uid || ''}
    />
  ), [handlePress, user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBackground} />
      
      {/* Background Glows */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
      </View>

      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          chats.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrapper}>
                <Icon name="chatbubble-ellipses-outline" size={48} color={colors.primaryAccent} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the new chat button to start connecting
              </Text>
            </View>
          ) : null
        }
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('NewChat')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: colors.primaryAccent,
    opacity: 0.04,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: '#3B82F6',
    opacity: 0.03,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
    paddingBottom: spacing.m,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: spacing.s,
  },
  listContentEmpty: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    marginTop: -50,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.large,
    fontWeight: '700',
    marginBottom: spacing.s,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.regular,
    lineHeight: typography.lineHeight.regular,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    backgroundColor: colors.primaryAccent,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
}));

export default ChatListScreen;
