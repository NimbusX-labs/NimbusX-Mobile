import { supabase } from '../../config/supabase';
import { Chat, Message, User, Status } from '@types';

// Helper to map DB chat to client Chat type
const mapChat = (chat: any): Chat => {
  return {
    id: chat.id,
    type: chat.type,
    members: chat.members || [],
    name: chat.name,
    description: chat.description,
    avatarUrl: chat.avatar_url,
    lastMessage: chat.last_message,
    lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at).getTime() : undefined,
    lastMessageSenderId: chat.last_message_sender_id,
    unreadCount: chat.unread_count || {},
    typing: chat.typing || {},
    admins: chat.admins || {},
    createdBy: chat.created_by,
    createdAt: chat.created_at ? new Date(chat.created_at).getTime() : Date.now(),
  };
};

const mapChats = (chats: any[]): Chat[] => chats.map(mapChat);

// Helper to map DB message to client Message type
const mapMessage = (msg: any): Message => {
  return {
    id: msg.id,
    chatId: msg.chat_id,
    senderId: msg.sender_id,
    text: msg.text || '',
    status: msg.status,
    mediaUrl: msg.media_url,
    mediaType: msg.media_type,
    mediaPath: msg.media_path,
    mediaSize: msg.media_size,
    replyTo: msg.reply_to,
    createdAt: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
    isEdited: msg.is_edited || false,
    isPinned: msg.is_pinned || false,
  };
};

const mapMessages = (msgs: any[]): Message[] => msgs.map(mapMessage);

export const firestoreService = {
  /**
   * Listen to chats a user belongs to
   */
  listenUserChats(uid: string, callback: (chats: Chat[]) => void) {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('members', [uid])
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        callback(mapChats(data));
      } else if (error) {
        console.error('Fetch user chats failed:', error);
      }
    };

    fetchChats();

    const channel = supabase
      .channel(`user-chats-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          // Trigger reload if the user is or was a member of the chat
          const oldMembers = (payload.old as any)?.members || [];
          const newMembers = (payload.new as any)?.members || [];
          if (oldMembers.includes(uid) || newMembers.includes(uid)) {
            fetchChats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Listen to messages in a specific chat
   */
  listenMessages(chatId: string, limit: number, callback: (messages: Message[]) => void) {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        callback(mapMessages(data));
      } else if (error) {
        console.error('Fetch messages failed:', error);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          if (!newRow || !newRow.chat_id || newRow.chat_id === chatId || oldRow?.chat_id === chatId) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Send a message to a chat
   */
  async sendMessage(message: Partial<Message>) {
    const { chatId } = message;
    if (!chatId) throw new Error('Chat ID is required');

    const insertData: any = {
      chat_id: chatId,
      sender_id: message.senderId,
      text: message.text || '',
      status: message.status || 'sent',
      media_url: message.mediaUrl,
      media_type: message.mediaType,
      media_path: message.mediaPath,
      media_size: message.mediaSize,
      reply_to: message.replyTo,
    };

    if (message.id) {
      insertData.id = message.id;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Send message failed:', error);
      throw error;
    }
    return data;
  },

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string, messageId: string) {
    if (!chatId || !messageId) return;
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Delete message failed:', error);
      throw error;
    }
  },

  /**
   * Edit a message's text
   */
  async editMessage(chatId: string, messageId: string, newText: string) {
    if (!chatId || !messageId) return;
    const { error } = await supabase
      .from('messages')
      .update({ text: newText, is_edited: true })
      .eq('id', messageId);

    if (error) {
      console.error('Edit message failed:', error);
      throw error;
    }
  },

  /**
   * Pin or unpin a message
   */
  async setPinMessage(chatId: string, messageId: string, isPinned: boolean) {
    if (!chatId || !messageId) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);

    if (error) {
      console.error('Set pin message failed:', error);
      throw error;
    }
  },

  /**
   * Create a new chat or group
   */
  async createChat(chatConfig: Partial<Chat>) {
    const insertData: any = {
      type: chatConfig.type,
      members: chatConfig.members,
      name: chatConfig.name,
      description: chatConfig.description,
      avatar_url: chatConfig.avatarUrl,
      unread_count: chatConfig.unreadCount || {},
      typing: chatConfig.typing || {},
      admins: chatConfig.admins || {},
      created_by: chatConfig.createdBy,
    };

    const { data, error } = await supabase
      .from('chats')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('Create chat failed:', error);
      throw error;
    }
    return data.id;
  },

  /**
   * Delete a chat document
   */
  async deleteChat(chatId: string) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Delete chat failed:', error);
      throw error;
    }
  },

  /**
   * Update or create a user profile in the database.
   * Uses RPC (SECURITY DEFINER) when available to avoid RLS insert failures.
   */
  async saveUser(userObj: Partial<User> & { uid: string }) {
    const { uid, ...data } = userObj;
    const email = data.email ? data.email.toLowerCase().trim() : undefined;

    if (!email) {
      console.warn('saveUser: email is required to create/update a profile');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUid = sessionData.session?.user?.id;
    if (sessionUid && sessionUid !== uid) {
      console.warn('saveUser: session user does not match uid; using session user');
    }

    const profileId = sessionUid || uid;

    const { error: rpcError } = await supabase.rpc('upsert_own_profile', {
      p_email: email,
      p_display_name: data.displayName ?? null,
      p_avatar_url: data.avatarUrl ?? null,
      p_status: data.status ?? null,
    });

    if (!rpcError) {
      return;
    }

    const rpcMissing =
      rpcError.code === '42883' ||
      rpcError.code === 'PGRST202' ||
      /upsert_own_profile/i.test(rpcError.message || '');

    if (!rpcMissing) {
      console.error('Save user failed (rpc):', rpcError);
      throw rpcError;
    }

    const patch: Record<string, unknown> = {
      email,
      updated_at: new Date().toISOString(),
    };
    if (data.displayName !== undefined) patch.display_name = data.displayName;
    if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl;
    if (data.status !== undefined) patch.status = data.status;

    const { data: updatedRows, error: updateError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', profileId)
      .select('id');

    if (!updateError && updatedRows && updatedRows.length > 0) {
      return;
    }

    const insertRow: Record<string, unknown> = {
      id: profileId,
      email,
      display_name: data.displayName ?? '',
      avatar_url: data.avatarUrl ?? '',
      status: data.status ?? 'Hey there! I am using NimbusX',
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('profiles').insert(insertRow);

    if (insertError) {
      console.error(
        'Save user failed. Run supabase-fix-profiles-rls.sql in Supabase SQL Editor.',
        insertError,
      );
      throw insertError;
    }
  },

  /**
   * Get a user profile from the database
   */
  async getUser(uid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Get user failed:', error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      uid: data.id,
      email: data.email,
      displayName: data.display_name || '',
      avatarUrl: data.avatar_url || '',
      status: data.status || '',
      isOnline: data.is_online || false,
      lastSeen: data.last_seen ? new Date(data.last_seen).getTime() : undefined,
    } as User;
  },

  /**
   * Search users by exact email
   */
  async searchUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Search user by email failed:', error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      uid: data.id,
      email: data.email,
      displayName: data.display_name || '',
      avatarUrl: data.avatar_url || '',
      status: data.status || '',
      isOnline: data.is_online || false,
      lastSeen: data.last_seen ? new Date(data.last_seen).getTime() : undefined,
    } as User;
  },

  /**
   * Add a contact to a user's contact list
   */
  async addContact(currentUid: string, contactData: User) {
    if (currentUid === contactData.uid) {
      throw new Error('Cannot add yourself as a contact');
    }

    const { error } = await supabase
      .from('contacts')
      .insert({
        user_id: currentUid,
        contact_id: contactData.uid,
      });

    if (error) {
      if (error.code === '23505') { // Unique key violation
        return;
      }
      console.error('Add contact failed:', error);
      throw error;
    }
  },

  /**
   * Listen to a user's contacts
   */
  listenContacts(uid: string, callback: (contacts: User[]) => void) {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('profiles:contact_id(id, email, display_name, avatar_url, status, is_online, last_seen)')
        .eq('user_id', uid);

      if (!error && data) {
        const contacts = data
          .map((row: any) => {
            const p = row.profiles;
            if (!p) return null;
            return {
              id: p.id,
              uid: p.id,
              email: p.email,
              displayName: p.display_name || '',
              avatarUrl: p.avatar_url || '',
              status: p.status || '',
              isOnline: p.is_online || false,
              lastSeen: p.last_seen ? new Date(p.last_seen).getTime() : undefined,
            };
          })
          .filter(Boolean) as User[];

        // Order contacts alphabetically
        contacts.sort((a, b) => a.displayName.localeCompare(b.displayName));
        callback(contacts);
      } else if (error) {
        console.error('Fetch contacts failed:', error);
      }
    };

    fetchContacts();

    const channel = supabase
      .channel(`user-contacts-${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Batch update message statuses
   */
  async updateMessageStatus(chatId: string, messageIds: string[], status: 'delivered' | 'read') {
    if (!messageIds || messageIds.length === 0) return;

    const { error } = await supabase
      .from('messages')
      .update({ status })
      .in('id', messageIds);

    if (error) {
      console.error('Update message status failed:', error);
      throw error;
    }
  },

  /**
   * Set typing status for a user in a chat
   */
  async setTypingStatus(chatId: string, uid: string, isTyping: boolean) {
    if (!chatId || !uid) return;

    const { data, error } = await supabase
      .from('chats')
      .select('typing')
      .eq('id', chatId)
      .maybeSingle();

    if (error) {
      console.error('Fetch typing failed:', error);
      return;
    }

    const currentTyping = data?.typing || {};
    currentTyping[uid] = isTyping;

    const { error: updateError } = await supabase
      .from('chats')
      .update({ typing: currentTyping })
      .eq('id', chatId);

    if (updateError) {
      console.error('Set typing status failed:', updateError);
    }
  },

  /**
   * Post a new status update
   */
  async postStatus(status: Omit<Status, 'id'>): Promise<string> {
    const now = new Date();
    const expiresAt = status.expiresAt ? new Date(status.expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('statuses')
      .insert({
        uid: status.uid,
        display_name: status.displayName,
        avatar_url: status.avatarUrl || '',
        text: status.text || '',
        image_url: status.imageUrl,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Post status failed:', error);
      throw error;
    }
    return data.id;
  },

  /**
   * Listen to all active statuses
   */
  listenStatuses(callback: (statuses: Status[]) => void) {
    const fetchStatuses = async () => {
      const nowStr = new Date().toISOString();
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .gt('expires_at', nowStr)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const statuses = data.map((row: any) => ({
          id: row.id,
          uid: row.uid,
          displayName: row.display_name,
          avatarUrl: row.avatar_url || '',
          text: row.text || '',
          imageUrl: row.image_url,
          createdAt: new Date(row.created_at).getTime(),
          expiresAt: new Date(row.expires_at).getTime(),
        })) as Status[];
        callback(statuses);
      } else if (error) {
        console.error('Fetch statuses failed:', error);
      }
    };

    fetchStatuses();

    const channel = supabase
      .channel('statuses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses' },
        () => {
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Update group details
   */
  async updateGroupDetails(chatId: string, data: { name?: string; description?: string; avatarUrl?: string }) {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

    const { error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId);

    if (error) {
      console.error('Update group details failed:', error);
      throw error;
    }
  },

  /**
   * Remove a member from a group
   */
  async removeGroupMember(chatId: string, uid: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('members, unread_count, typing, admins')
      .eq('id', chatId)
      .maybeSingle();

    if (error || !data) {
      console.error('Fetch chat for member removal failed:', error);
      throw error || new Error('Chat not found');
    }

    const members = (data.members || []).filter((m: string) => m !== uid);
    const unreadCount = { ...(data.unread_count || {}) };
    delete unreadCount[uid];
    const typing = { ...(data.typing || {}) };
    delete typing[uid];
    const admins = { ...(data.admins || {}) };
    delete admins[uid];

    const { error: updateError } = await supabase
      .from('chats')
      .update({
        members,
        unread_count: unreadCount,
        typing,
        admins,
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Remove member failed:', updateError);
      throw updateError;
    }
  },

  /**
   * Leave a group (self-remove)
   */
  async leaveGroup(chatId: string, uid: string) {
    return this.removeGroupMember(chatId, uid);
  },

  /**
   * Delete a group and cascade delete all its messages
   */
  async deleteGroup(chatId: string) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Delete group failed:', error);
      throw error;
    }
  },

  /**
   * Clear all messages in a specific chat
   */
  async clearMessages(chatId: string) {
    if (!chatId) return;
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      console.error('Clear messages failed:', error);
      throw error;
    }
  },
};

