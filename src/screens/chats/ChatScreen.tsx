import React, { useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  View,
  Text,
  AlertButton
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { messagesSelectors, upsertMessage, addToOfflineQueue, removeMessage } from '@store/slices/messageSlice';
import { ChatStackParamList } from '@navigation/types';
import { useMessages } from '@hooks/useMessages';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { colors, spacing } from '@theme';
import { generateUUID } from '@utils/uuid';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@types';

// Components
import MessageBubble from '@components/chat/MessageBubble';
import ChatInput from '@components/chat/ChatInput';
import TypingIndicator from '@components/chat/TypingIndicator';
import ImagePreviewModal from '@components/chat/ImagePreviewModal';

type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

const ChatScreen = () => {
  const route = useRoute<ChatRouteProp>();
  const { chatId, otherUserName } = route.params;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  // Image preview state
  const [previewImageUri, setPreviewImageUri] = React.useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = React.useState(false);

  // Edit message state
  const [editingMessage, setEditingMessage] = React.useState<Message | null>(null);

  // Typing reference
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set header title and actions
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
              // 1. Delete all media files from Supabase Storage
              await storageService.deleteChatMediaFolder(chatId);
              // 2. Delete chat from database (cascades to messages)
              await firestoreService.deleteChat(chatId);
              // 3. Go back to chat list
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

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: otherUserName || 'Chat',
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleDeleteChat} 
          style={{ marginRight: spacing.m, padding: spacing.xs }}
        >
          <Icon name="trash-outline" size={22} color="#ff4444" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName, handleDeleteChat]);

  // High-performance selector
  const messages = useAppSelector((state) => 
    messagesSelectors.selectAll(state).filter(m => m.chatId === chatId)
  ).sort((a, b) => b.createdAt - a.createdAt); // Inverted list

  const chat = useAppSelector((state) => state.chats.entities[chatId]);
  const typingUserIds = Object.keys(chat?.typing || {}).filter(
    (uid) => chat?.typing?.[uid] && uid !== user?.uid
  );
  const typingUsers = typingUserIds.length > 0 ? [otherUserName || 'Someone'] : [];

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
      id: messageId,
      chatId,
      senderId: user.uid,
      text,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Optimistic Update
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
      firestoreService.setTypingStatus(chatId, user.uid, false);
      // Update the optimistic temp message to 'sent' so the tick appears immediately
      dispatch(upsertMessage({ ...tempMsg, status: 'sent' }));
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(upsertMessage({ ...tempMsg, status: 'failed' }));
      dispatch(addToOfflineQueue(tempMsg));
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!user) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    firestoreService.setTypingStatus(chatId, user.uid, isTyping);
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        firestoreService.setTypingStatus(chatId, user.uid, false);
      }, 3000);
    }
  };

  // ── Send media ───────────────────────────────────────────────
  const handleSendMedia = async (attachment: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'file';
    fileName?: string;
    mimeType?: string;
  }) => {
    if (!user) return;

    // Default mimeType if none provided
    const mimeType = attachment.mimeType || 'application/octet-stream';
    const fileName = attachment.fileName || `upload_${Date.now()}.bin`;

    const messageId = generateUUID();
    const tempMsg: any = {
      id: messageId,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: attachment.uri, // Use local URI for instant optimistic preview
      mediaType: attachment.type,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Optimistic Update so it previews instantly in the chat window!
    dispatch(upsertMessage(tempMsg));

    try {
      const uploadResult = await storageService.uploadMedia(chatId, attachment.uri, mimeType, fileName);

      await firestoreService.sendMessage({
        id: messageId,
        chatId,
        senderId: user.uid,
        text: '',
        mediaUrl: uploadResult.url,
        mediaType: attachment.type,
        mediaPath: uploadResult.mediaPath,
        mediaSize: uploadResult.size,
        createdAt: Date.now(),
        status: 'sent',
      });
      
      // Update optimistic message with final URL and status, keep it visible
      dispatch(upsertMessage({
        ...tempMsg,
        mediaUrl: uploadResult.url,
        mediaPath: uploadResult.mediaPath,
        status: 'sent',
      }));
    } catch (error) {
      console.error('Failed to send media:', error);
      // Mark the optimistic message as failed
      dispatch(upsertMessage({
        ...tempMsg,
        status: 'failed',
      }));
      dispatch(addToOfflineQueue(tempMsg));
      // Show error notification to user
      Alert.alert(
        'Upload Failed',
        'Could not upload media to cloud. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // ── Send GIF ──────────────────────────────────────────────────
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

  // ── Send Sticker ──────────────────────────────────────────────
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
    paddingVertical: spacing.l,
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

export default ChatScreen;
