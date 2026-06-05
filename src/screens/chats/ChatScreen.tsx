import React, { useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  View,
  Text,
  AlertButton,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { messagesSelectors, upsertMessage, addToOfflineQueue, removeMessage, clearChatMessages } from '@store/slices/messageSlice';
import { ChatStackParamList } from '@navigation/types';
import { useMessages } from '@hooks/useMessages';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { ChatAttachment, createOptimisticMediaMessage, sendMediaMessage } from '@services/chatMedia';
import { useThemeColors, createThemedStyles, spacing } from '@theme';
import { generateUUID } from '@utils/uuid';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@types';
import Avatar from '@components/common/Avatar';
import { userSelectors, upsertUser } from '@store/slices/userSlice';

// Components
import MessageBubble from '@components/chat/MessageBubble';
import ChatInput from '@components/chat/ChatInput';
import TypingIndicator from '@components/chat/TypingIndicator';
import ImagePreviewModal from '@components/chat/ImagePreviewModal';

type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  dividerAbove?: boolean;
}

const ChatScreen = () => {
  const colors = useThemeColors();
  const route = useRoute<ChatRouteProp>();
  const { chatId, otherUserName } = route.params;
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const storageMode = useAppSelector((state) => state.auth.storageMode);
  const wallpaper = useAppSelector((state) => state.settings.wallpaper);
  
  // Image preview state
  const [previewImageUri, setPreviewImageUri] = React.useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = React.useState(false);

  // Edit message state
  const [editingMessage, setEditingMessage] = React.useState<Message | null>(null);

  // Menu visible state
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Typing reference
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch other user reactively
  const chat = useAppSelector((state) => state.chats.entities[chatId]);
  const otherUserId = chat?.type !== 'group' ? chat?.members?.find((id) => id !== user?.uid) : undefined;
  const otherUser = useAppSelector(state => otherUserId ? userSelectors.selectById(state, otherUserId) : null);

  React.useEffect(() => {
    if (otherUserId) {
      firestoreService.getUser(otherUserId).then((usr) => {
        if (usr) {
          dispatch(upsertUser(usr));
        }
      }).catch(err => console.warn('ChatScreen: failed to fetch user profile:', err));
    }
  }, [otherUserId, dispatch]);
  
  // ── Action Handlers ───────────────────────────────────────────
  const handleDeleteChat = React.useCallback(() => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to permanently delete this chat, all its messages, and all shared files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteChatMediaFolder(chatId);
              await firestoreService.deleteChat(chatId);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete chat:', err);
              Alert.alert('Error', 'Could not delete chat. Please try again.');
            }
          }
        }
      ]
    );
  }, [chatId, navigation]);

  const handleClearChat = React.useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages in this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.clearMessages(chatId);
              dispatch(clearChatMessages({ chatId }));
            } catch (err) {
              console.error('Failed to clear chat:', err);
              Alert.alert('Error', 'Could not clear messages. Please try again.');
            }
          }
        }
      ]
    );
  }, [chatId, dispatch]);

  const handleViewContact = React.useCallback(() => {
    if (chat?.type === 'group') {
      navigation.navigate('GroupInfo' as any, { chatId });
    } else {
      navigation.navigate('ContactInfo' as any, { 
        chatId, 
        otherUserName: otherUser?.displayName || otherUserName, 
        otherUserAvatar: otherUser?.avatarUrl || route.params.otherUserAvatar 
      });
    }
  }, [chat?.type, chatId, navigation, otherUserName, otherUser?.displayName, otherUser?.avatarUrl, route.params.otherUserAvatar]);

  const handleSearch = React.useCallback(() => {
    Alert.alert('Search', 'Search in chat coming soon.');
  }, []);

  const handleSelectMessages = React.useCallback(() => {
    Alert.alert('Select Messages', 'Select mode coming soon.');
  }, []);

  const handleDisappearingMessages = React.useCallback(() => {
    navigation.navigate('ContactInfo' as any, { 
      chatId, 
      otherUserName: otherUser?.displayName || otherUserName, 
      otherUserAvatar: otherUser?.avatarUrl || route.params.otherUserAvatar,
      openDisappearing: true,
    });
  }, [chatId, navigation, otherUser, otherUserName, route.params.otherUserAvatar]);

  const handleAddToFavourites = React.useCallback(() => {
    Alert.alert('Add to Favourites', 'This chat has been added to your favourites.');
  }, []);

  const handleCloseChat = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ── Menu Items (WhatsApp-style) ───────────────────────────────
  const menuItems: MenuItem[] = React.useMemo(() => [
    {
      label: 'Contact info',
      icon: 'person-circle-outline',
      onPress: () => { setMenuVisible(false); handleViewContact(); },
    },
    {
      label: 'Search',
      icon: 'search-outline',
      onPress: () => { setMenuVisible(false); handleSearch(); },
    },
    {
      label: 'Select messages',
      icon: 'checkbox-outline',
      onPress: () => { setMenuVisible(false); handleSelectMessages(); },
    },
    {
      label: 'Disappearing messages',
      icon: 'timer-outline',
      onPress: () => { setMenuVisible(false); handleDisappearingMessages(); },
    },
    {
      label: 'Add to favourites',
      icon: 'heart-outline',
      onPress: () => { setMenuVisible(false); handleAddToFavourites(); },
    },
    {
      label: 'Close chat',
      icon: 'close-circle-outline',
      onPress: () => { setMenuVisible(false); handleCloseChat(); },
      dividerAbove: true,
    },
    {
      label: 'Clear chat',
      icon: 'trash-outline',
      onPress: () => { setMenuVisible(false); handleClearChat(); },
      dividerAbove: true,
    },
    {
      label: 'Delete chat',
      icon: 'trash',
      onPress: () => { setMenuVisible(false); handleDeleteChat(); },
      color: colors.error,
    },
  ], [handleViewContact, handleSearch, handleSelectMessages, handleDisappearingMessages, handleAddToFavourites, handleCloseChat, handleClearChat, handleDeleteChat]);

  // High-performance selector
  const allMessages = useAppSelector(messagesSelectors.selectAll);
  const messages = React.useMemo(() => {
    return allMessages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allMessages, chatId]);

  const typingUsers = React.useMemo(() => {
    const typingUserIds = Object.keys(chat?.typing || {}).filter(
      (uid) => chat?.typing?.[uid] && uid !== user?.uid
    );
    return typingUserIds.length > 0 ? [otherUserName || 'Someone'] : [];
  }, [chat?.typing, user?.uid, otherUserName]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          style={styles.headerContainer} 
          onPress={handleViewContact}
          activeOpacity={0.7}
        >
          <Avatar uri={otherUser?.avatarUrl || route.params.otherUserAvatar} name={otherUserName || 'Chat'} size={36} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUserName || 'Chat'}
            </Text>
            {typingUsers.length > 0 ? (
              <Text style={styles.headerSubtitleActive} numberOfLines={1}>
                typing...
              </Text>
            ) : (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {chat?.type === 'group' ? 'Group Info' : 'tap for info'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setMenuVisible(true)} 
          style={{ marginRight: spacing.m, padding: spacing.xs }}
        >
          <Icon name="ellipsis-vertical" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName, otherUser?.avatarUrl, route.params.otherUserAvatar, chat?.type, typingUsers, handleViewContact]);

  // Pinned messages
  const pinnedMessages = messages.filter((m) => m.isPinned);
  const latestPinnedMessage = pinnedMessages[0];

  const { loadMore } = useMessages(chatId);

  // Mark received messages as read
  React.useEffect(() => {
    if (!user || messages.length === 0) return;
    const unreadMessages = messages.filter(
      m => m.senderId !== user.uid && m.status !== 'read' && !m.id.startsWith('temp_')
    );
    if (unreadMessages.length > 0) {
      const ids = unreadMessages.map(m => m.id);
      firestoreService.updateMessageStatus(chatId, ids, 'read').catch(console.error);
    }
  }, [messages, user, chatId]);

  // Mark received messages as delivered
  React.useEffect(() => {
    if (!user || messages.length === 0) return;
    const undeliveredMessages = messages.filter(
      m => m.senderId !== user.uid && m.status === 'sent' && !m.id.startsWith('temp_')
    );
    if (undeliveredMessages.length > 0) {
      const ids = undeliveredMessages.map(m => m.id);
      firestoreService.updateMessageStatus(chatId, ids, 'delivered').catch(console.error);
    }
  }, [messages, user, chatId]);

  const handleSend = async (text: string) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = {
      id: messageId, chatId, senderId: user.uid, text,
      createdAt: Date.now(), status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({ id: messageId, chatId, senderId: user.uid, text, createdAt: Date.now(), status: 'sent' });
      firestoreService.setTypingStatus(chatId, user.uid, false);
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
      dispatch(addToOfflineQueue(tempMsg));
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    firestoreService.setTypingStatus(chatId, user.uid, isTyping);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        firestoreService.setTypingStatus(chatId, user.uid, false);
      }, 3000);
    }
  };

  const handleSendMedia = async (attachment: ChatAttachment) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg = createOptimisticMediaMessage(chatId, user.uid, messageId, attachment);
    dispatch(upsertMessage(tempMsg));
    try {
      const sentMessage = await sendMediaMessage({ chatId, senderId: user.uid, messageId, attachment, storageMode });
      dispatch(upsertMessage(sentMessage));
    } catch (error) {
      console.error('Failed to send media:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
      dispatch(addToOfflineQueue(tempMsg));
      Alert.alert('Send Failed', storageMode === 'cloud' ? 'Could not upload the file to cloud.' : 'Could not save and send the file.', [{ text: 'OK' }]);
    }
  };

  const handleSendGif = async (gif: { url: string }) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = { id: messageId, chatId, senderId: user.uid, text: '', mediaUrl: gif.url, mediaType: 'gif', createdAt: Date.now(), status: 'pending' };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({ id: messageId, chatId, senderId: user.uid, text: '', mediaUrl: gif.url, mediaType: 'gif', createdAt: Date.now(), status: 'sent' });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send GIF:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleSendSticker = async (sticker: { url: string }) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = { id: messageId, chatId, senderId: user.uid, text: '', mediaUrl: sticker.url, mediaType: 'sticker', createdAt: Date.now(), status: 'pending' };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({ id: messageId, chatId, senderId: user.uid, text: '', mediaUrl: sticker.url, mediaType: 'sticker', createdAt: Date.now(), status: 'sent' });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send sticker:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleStartEdit = React.useCallback((message: Message) => setEditingMessage(message), []);
  const handleCancelEdit = React.useCallback(() => setEditingMessage(null), []);

  const handleSaveEdit = React.useCallback(async (text: string) => {
    if (!editingMessage) return;
    try {
      await firestoreService.editMessage(chatId, editingMessage.id, text);
      dispatch(upsertMessage({ ...editingMessage, text, isEdited: true }));
      setEditingMessage(null);
    } catch (err) {
      console.error('Failed to edit message:', err);
      Alert.alert('Error', 'Could not edit message. Please try again.');
    }
  }, [editingMessage, chatId, dispatch]);

  const handleTogglePin = React.useCallback(async (message: Message) => {
    const nextPinState = !message.isPinned;
    try {
      await firestoreService.setPinMessage(chatId, message.id, nextPinState);
      dispatch(upsertMessage({ ...message, isPinned: nextPinState }));
    } catch (err) {
      console.error('Failed to pin/unpin message:', err);
      Alert.alert('Error', 'Could not update pin status.');
    }
  }, [chatId, dispatch]);

  const handleDeleteMessage = React.useCallback((message: Message) => {
    const options: AlertButton[] = [{ text: 'Cancel', style: 'cancel' as const }];
    if (message.senderId === user?.uid) {
      options.push({
        text: 'Delete for Everyone', style: 'destructive' as const,
        onPress: async () => {
          try {
            if (message.mediaPath) await storageService.deleteMedia(message.mediaPath);
            await firestoreService.deleteMessage(chatId, message.id);
            dispatch(removeMessage(message.id));
          } catch (err) {
            console.error('Failed to delete message for everyone:', err);
            Alert.alert('Error', 'Could not delete message.');
          }
        }
      });
    }
    options.push({ text: 'Delete for Me', style: 'destructive' as const, onPress: () => dispatch(removeMessage(message.id)) });
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', options);
  }, [chatId, user, dispatch]);

  const handleMessageLongPress = React.useCallback((message: Message) => {
    const options: AlertButton[] = [];
    if (message.senderId === user?.uid && !message.mediaUrl) {
      options.push({ text: 'Edit Message', onPress: () => handleStartEdit(message) });
    }
    options.push({ text: message.isPinned ? 'Unpin Message' : 'Pin Message', onPress: () => handleTogglePin(message) });
    options.push({ text: 'Delete Message', style: 'destructive' as const, onPress: () => handleDeleteMessage(message) });
    options.push({ text: 'Cancel', style: 'cancel' as const });
    Alert.alert('Message Options', undefined, options);
  }, [user, handleStartEdit, handleTogglePin, handleDeleteMessage]);

  const handlePressImage = React.useCallback((uri: string) => {
    setPreviewImageUri(uri);
    setPreviewVisible(true);
  }, []);

  return (
    <SafeAreaView style={[styles.container, wallpaper ? { backgroundColor: wallpaper } : null]}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Pinned message banner */}
        {latestPinnedMessage && (
          <View style={styles.pinnedBanner}>
            <View style={styles.pinnedContent}>
              <Icon name="pin" size={16} color={colors.primaryAccent} />
              <Text style={styles.pinnedText} numberOfLines={1}>
                Pinned: {latestPinnedMessage.text || (latestPinnedMessage.mediaType ? `[${latestPinnedMessage.mediaType}]` : 'Attachment')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleTogglePin(latestPinnedMessage)} style={styles.unpinButton}>
              <Icon name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isMine={item.senderId === user?.uid} 
              onLongPress={handleMessageLongPress}
              onPressImage={handlePressImage}
            />
          )}
          keyExtractor={(item) => item.id}
          inverted
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            typingUsers.length > 0 ? <TypingIndicator typingUsers={typingUsers} /> : null
          }
        />
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          onSendMedia={handleSendMedia}
          onSendGif={handleSendGif}
          onSendSticker={handleSendSticker}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
        />
      </KeyboardAvoidingView>

      {/* Fullscreen Image Previewer */}
      <ImagePreviewModal
        visible={previewVisible}
        imageUri={previewImageUri}
        onClose={() => setPreviewVisible(false)}
      />

      {/* WhatsApp-style Dropdown Menu */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {item.dividerAbove && <View style={styles.menuDivider} />}
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={item.icon}
                    size={19}
                    color={item.color || colors.textSecondary}
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuItemText, item.color ? { color: item.color } : {}]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  flex: { flex: 1 },
  listContent: { paddingVertical: spacing.s },
  // ── Pinned Banner ──
  pinnedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.secondaryBackground, paddingHorizontal: spacing.l,
    paddingVertical: spacing.s, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  pinnedContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pinnedText: { color: colors.textPrimary, fontSize: 14, marginLeft: spacing.s, flex: 1 },
  unpinButton: { padding: spacing.xs },
  // ── Header ──
  headerContainer: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xxs,
    marginLeft: Platform.OS === 'ios' ? 0 : -spacing.m,
  },
  headerTextContainer: { marginLeft: spacing.s, justifyContent: 'center' },
  headerName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
  headerSubtitleActive: { color: colors.primaryAccent, fontSize: 11, fontWeight: '600', marginTop: 1 },
  // ── Menu ──
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  menuCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 50,
    right: spacing.m,
    backgroundColor: '#1A2634',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 210,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.l,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { marginRight: spacing.m, width: 20, textAlign: 'center' },
  menuItemText: { color: colors.textPrimary, fontSize: 14.5, fontWeight: '400' },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing.l },
}));

export default ChatScreen;
