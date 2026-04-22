import React, { useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { messagesSelectors, upsertMessage, addToOfflineQueue } from '@store/slices/messageSlice';
import { ChatStackParamList } from '@navigation/types';
import { useMessages } from '@hooks/useMessages';
import { firestoreService } from '@services/firebase/firestore';
import { storageService } from '@services/firebase/storage';
import { colors, spacing } from '@theme';

// Components
import MessageBubble from '@components/chat/MessageBubble';
import ChatInput from '@components/chat/ChatInput';
import TypingIndicator from '@components/chat/TypingIndicator';

type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;

const ChatScreen = () => {
  const route = useRoute<ChatRouteProp>();
  const { chatId, otherUserName } = route.params;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  // Typing reference
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set header title
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: otherUserName || 'Chat',
    });
  }, [navigation, otherUserName]);

  // High-performance selector
  const messages = useAppSelector((state) => 
    messagesSelectors.selectAll(state).filter(m => m.chatId === chatId)
  ).sort((a, b) => b.createdAt - a.createdAt); // Inverted list

  const chat = useAppSelector((state) => state.chats.entities[chatId]);
  const typingUserIds = Object.keys(chat?.typing || {}).filter(
    (uid) => chat?.typing?.[uid] && uid !== user?.uid
  );
  const typingUsers = typingUserIds.length > 0 ? [otherUserName || 'Someone'] : [];

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

    const tempMsg: any = {
      id: `temp_${Date.now()}`,
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
        chatId,
        senderId: user.uid,
        text,
        createdAt: Date.now(),
        status: 'sent',
      });
      firestoreService.setTypingStatus(chatId, user.uid, false);
      // Real-time listener will replace the temp message via Firestore ID update
    } catch (error) {
      console.error('Failed to send message:', error);
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
    
    // Get the user's actual storage mode for the UI (so it doesn't default to 'local' while uploading)
    const currentStorageMode = await storageService.getStorageMode();

    const tempMsg: any = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId: user.uid,
      text: '',
      mediaUrl: attachment.uri, // Use local URI for instant optimistic preview
      mediaType: attachment.type,
      storageMode: currentStorageMode,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Optimistic Update so it previews instantly in the chat window!
    dispatch(upsertMessage(tempMsg));

    try {
      const uploadResult = await storageService.uploadMedia(chatId, attachment.uri, mimeType, fileName);

      await firestoreService.sendMessage({
        chatId,
        senderId: user.uid,
        text: '',
        mediaUrl: uploadResult.url,
        mediaType: attachment.type,
        mediaPublicId: uploadResult.publicId,
        mediaSize: uploadResult.size,
        mediaUploadedAt: uploadResult.uploadedAt,
        storageMode: uploadResult.mode,
        createdAt: Date.now(),
        status: 'sent',
      });
      
      // Update optimistic message with final URL and status, keep it visible
      dispatch(upsertMessage({
        ...tempMsg,
        mediaUrl: uploadResult.url,
        status: 'sent',
        storageMode: uploadResult.mode,
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isMine={item.senderId === user?.uid} 
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
        <ChatInput onSend={handleSend} onTyping={handleTyping} onSendMedia={handleSendMedia} />
      </KeyboardAvoidingView>
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
});

export default ChatScreen;
