import React, { useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Alert,
  AlertButton
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { messagesSelectors, upsertMessage, removeMessage } from '@store/slices/messageSlice';
import { ChatStackParamList } from '@navigation/types';
import { useMessages } from '@hooks/useMessages';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { generateUUID } from '@utils/uuid';
import { Message } from '@types';
import ImagePreviewModal from '@components/chat/ImagePreviewModal';

// Components
import MessageBubble from '@components/chat/MessageBubble';
import ChatInput from '@components/chat/ChatInput';

type GroupChatRouteProp = RouteProp<ChatStackParamList, 'GroupChat'>;

const HeaderRight = React.memo(({ chatId, navigation }: { chatId: string; navigation: any }) => (
  <TouchableOpacity 
    style={{ marginRight: spacing.m }}
    onPress={() => navigation.navigate('GroupInfo', { chatId })}
  >
    <Icon name="information-circle-outline" size={28} color={colors.textPrimary} />
  </TouchableOpacity>
));

const GroupChatScreen = () => {
  const route = useRoute<GroupChatRouteProp>();
  const navigation = useNavigation<any>();
  const { chatId, groupName } = route.params;
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  // Image preview state
  const [previewImageUri, setPreviewImageUri] = React.useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = React.useState(false);

  // Edit message state
  const [editingMessage, setEditingMessage] = React.useState<Message | null>(null);

  const messages = useAppSelector((state) => 
    messagesSelectors.selectAll(state).filter(m => m.chatId === chatId)
  ).sort((a, b) => b.createdAt - a.createdAt);

  const { loadMore } = useMessages(chatId);

  // Pinned messages
  const pinnedMessages = messages.filter((m) => m.isPinned);
  const latestPinnedMessage = pinnedMessages[0];

  // Stable render function for headerRight
  const renderHeaderRight = useCallback(
    () => <HeaderRight chatId={chatId} navigation={navigation} />,
    [chatId, navigation]
  );

  // Set Header Title with Info Icon
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: groupName,
      headerRight: renderHeaderRight,
    });
  }, [navigation, groupName, renderHeaderRight]);

  const handleSend = async (text: string) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = {
      id: messageId,
      chatId,
      senderId: user.uid,
      text,
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        id: messageId,
        chatId,
        senderId: user.uid,
        text,
        createdAt: Date.now(),
        status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send group message:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleSendGif = async (gif: { url: string }) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = {
      id: messageId,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: gif.url,
      mediaType: 'gif',
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        id: messageId,
        chatId,
        senderId: user.uid,
        text: '',
        mediaUrl: gif.url,
        mediaType: 'gif',
        createdAt: Date.now(),
        status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send GIF:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  const handleSendSticker = async (sticker: { url: string }) => {
    if (!user) return;
    const messageId = generateUUID();
    const tempMsg: any = {
      id: messageId,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: sticker.url,
      mediaType: 'sticker',
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch(upsertMessage(tempMsg));
    try {
      await firestoreService.sendMessage({
        id: messageId,
        chatId,
        senderId: user.uid,
        text: '',
        mediaUrl: sticker.url,
        mediaType: 'sticker',
        createdAt: Date.now(),
        status: 'sent',
      });
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send sticker:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
    }
  };

  // ── Edit Message Handlers ─────────────────────────────────────
  const handleStartEdit = React.useCallback((message: Message) => {
    setEditingMessage(message);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setEditingMessage(null);
  }, []);

  const handleSaveEdit = React.useCallback(async (text: string) => {
    if (!editingMessage) return;
    try {
      await firestoreService.editMessage(chatId, editingMessage.id, text);
      dispatch(upsertMessage({
        ...editingMessage,
        text,
        isEdited: true
      }));
      setEditingMessage(null);
    } catch (err) {
      console.error('Failed to edit message:', err);
      Alert.alert('Error', 'Could not edit message. Please try again.');
    }
  }, [editingMessage, chatId, dispatch]);

  // ── Pin Message Handlers ──────────────────────────────────────
  const handleTogglePin = React.useCallback(async (message: Message) => {
    const nextPinState = !message.isPinned;
    try {
      await firestoreService.setPinMessage(chatId, message.id, nextPinState);
      dispatch(upsertMessage({
        ...message,
        isPinned: nextPinState
      }));
    } catch (err) {
      console.error('Failed to pin/unpin message:', err);
      Alert.alert('Error', 'Could not update pin status.');
    }
  }, [chatId, dispatch]);

  // ── Delete Message Handlers ───────────────────────────────────
  const handleDeleteMessage = React.useCallback((message: Message) => {
    const options: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (message.senderId === user?.uid) {
      options.push({
        text: 'Delete for Everyone',
        style: 'destructive' as const,
        onPress: async () => {
          try {
            if (message.mediaPath) {
              await storageService.deleteMedia(message.mediaPath);
            }
            await firestoreService.deleteMessage(chatId, message.id);
            dispatch(removeMessage(message.id));
          } catch (err) {
            console.error('Failed to delete message for everyone:', err);
            Alert.alert('Error', 'Could not delete message.');
          }
        }
      });
    }

    options.push({
      text: 'Delete for Me',
      style: 'destructive' as const,
      onPress: () => {
        dispatch(removeMessage(message.id));
      }
    });

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      options
    );
  }, [chatId, user, dispatch]);

  // ── Long Press Handler ────────────────────────────────────────
  const handleMessageLongPress = React.useCallback((message: Message) => {
    const options: AlertButton[] = [];

    if (message.senderId === user?.uid && !message.mediaUrl) {
      options.push({
        text: 'Edit Message',
        onPress: () => handleStartEdit(message)
      });
    }

    options.push({
      text: message.isPinned ? 'Unpin Message' : 'Pin Message',
      onPress: () => handleTogglePin(message)
    });

    options.push({
      text: 'Delete Message',
      style: 'destructive' as const,
      onPress: () => handleDeleteMessage(message)
    });

    options.push({
      text: 'Cancel',
      style: 'cancel' as const
    });

    Alert.alert(
      'Message Options',
      undefined,
      options
    );
  }, [user, handleStartEdit, handleTogglePin, handleDeleteMessage]);

  // ── Image Press Handler (Previewer) ──────────────────────────
  const handlePressImage = React.useCallback((uri: string) => {
    setPreviewImageUri(uri);
    setPreviewVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
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
            <View>
              {item.senderId !== user?.uid && (
                <Text style={styles.senderName}>User {item.senderId.substring(0, 4)}</Text>
              )}
              <MessageBubble 
                message={item} 
                isMine={item.senderId === user?.uid} 
                onLongPress={handleMessageLongPress}
                onPressImage={handlePressImage}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          inverted
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
        />
        <ChatInput
          onSend={handleSend}
          onTyping={() => {}}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.m,
  },
  senderName: {
    color: colors.primaryAccent,
    fontSize: 10,
    marginLeft: spacing.xl,
    marginBottom: -spacing.xs,
    fontWeight: 'bold',
  },
  // ── Pinned Banner Styles ──
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryBackground,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pinnedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinnedText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginLeft: spacing.s,
    flex: 1,
  },
  unpinButton: {
    padding: spacing.xs,
  },
});

export default GroupChatScreen;
