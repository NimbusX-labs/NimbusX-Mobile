import { supabase } from '../../config/supabase';
import { Chat, Message, User, Status } from '@types';
import { cryptoService } from '../../utils/crypto';

const publicKeyCache: Record<string, string> = {};

async function getOrFetchPublicKey(uid: string): Promise<string | null> {
  if (publicKeyCache[uid]) {
    return publicKeyCache[uid];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('public_key')
    .eq('id', uid)
    .maybeSingle();

  if (!error && data && data.public_key) {
    publicKeyCache[uid] = data.public_key;
    return data.public_key;
  }
  return null;
}

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

const mapProfile = (data: any): User => {
  if (!data) return null as unknown as User;
  return {
    id: data.id,
    uid: data.id,
    email: data.email || '',
    username: data.username || undefined,
    shareCode: data.share_code || undefined,
    displayName: data.display_name || data.username || '',
    avatarUrl: data.avatar_url || '',
    status: data.status || '',
    bio: data.bio || undefined,
    phoneE164: data.phone_e164 || undefined,
    phoneVerifiedAt: data.phone_verified_at ? new Date(data.phone_verified_at).getTime() : undefined,
    isOnline: data.is_online || false,
    lastSeen: data.last_seen ? new Date(data.last_seen).getTime() : undefined,
    publicKey: data.public_key || '',
    discoverableByPhone: data.discoverable_by_phone ?? true,
    phoneVisibility: data.phone_visibility || 'everyone',
    usernameChangedAt: data.username_changed_at ? new Date(data.username_changed_at).getTime() : undefined,
    shareCodeChangedAt: data.share_code_changed_at ? new Date(data.share_code_changed_at).getTime() : undefined,
    verificationType: data.verification_type || 'none',
  } as User;
};

export const firestoreService = {
  listenUserChats(uid: string, callback: (chats: Chat[]) => void) {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('members', [uid])
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        const otherUserIds = data
          .filter((chat) => chat.type === 'one-to-one')
          .map((chat) => chat.members?.find((m: string) => m !== uid))
          .filter(Boolean) as string[];

        const missingIds = otherUserIds.filter((id) => !publicKeyCache[id]);
        if (missingIds.length > 0) {
          try {
            const { data: profiles, error: profileError } = await supabase
              .from('profiles')
              .select('id, public_key')
              .in('id', missingIds);

            if (!profileError && profiles) {
              profiles.forEach((p) => {
                if (p.public_key) {
                  publicKeyCache[p.id] = p.public_key;
                }
              });
            }
          } catch (err) {
            console.error('listenUserChats: failed to batch fetch public keys:', err);
          }
        }

        const myPrivateKey = await cryptoService.getPrivateKey(uid);
        const decryptedChats = await Promise.all(
          data.map(async (chat) => {
            if (chat.type === 'one-to-one' && chat.last_message && myPrivateKey) {
              const otherId = chat.members?.find((m: string) => m !== uid);
              if (otherId) {
                const otherPublicKey = publicKeyCache[otherId];
                if (otherPublicKey) {
                  const decrypted = cryptoService.decryptMessage(
                    chat.last_message,
                    otherPublicKey,
                    myPrivateKey
                  );
                  return { ...chat, last_message: decrypted };
                }
              }
            }
            return chat;
          })
        );

        callback(mapChats(decryptedChats));
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

  listenMessages(chatId: string, limit: number, callback: (messages: Message[]) => void) {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        const { data: chatData } = await supabase
          .from('chats')
          .select('type, members')
          .eq('id', chatId)
          .maybeSingle();

        if (chatData && chatData.type === 'one-to-one') {
          const { data: sessionData } = await supabase.auth.getSession();
          const currentUid = sessionData.session?.user?.id;
          if (currentUid) {
            const otherId = chatData.members?.find((m: string) => m !== currentUid);
            if (otherId) {
              const otherPublicKey = await getOrFetchPublicKey(otherId);
              const myPrivateKey = await cryptoService.getPrivateKey(currentUid);
              if (otherPublicKey && myPrivateKey) {
                const decryptedData = data.map((msg: any) => {
                  if (msg.text) {
                    const decryptedText = cryptoService.decryptMessage(
                      msg.text,
                      otherPublicKey,
                      myPrivateKey
                    );
                    return { ...msg, text: decryptedText };
                  }
                  return msg;
                });
                callback(mapMessages(decryptedData));
                return;
              }
            }
          }
        }
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

  async sendMessage(message: Partial<Message>) {
    const { chatId } = message;
    if (!chatId) throw new Error('Chat ID is required');

    let textToSend = message.text || '';

    const { data: chatData } = await supabase
      .from('chats')
      .select('type, members')
      .eq('id', chatId)
      .maybeSingle();

    if (chatData && chatData.type === 'one-to-one' && textToSend && message.senderId) {
      const otherId = chatData.members?.find((m: string) => m !== message.senderId);
      if (otherId) {
        const otherPublicKey = await getOrFetchPublicKey(otherId);
        const myPrivateKey = await cryptoService.getPrivateKey(message.senderId);
        if (otherPublicKey && myPrivateKey) {
          textToSend = cryptoService.encryptMessage(textToSend, otherPublicKey, myPrivateKey);
        }
      }
    }

    const insertData: any = {
      chat_id: chatId,
      sender_id: message.senderId,
      text: textToSend,
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

    return {
      ...data,
      text: message.text || '',
    };
  },

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

  async saveUser(userObj: Partial<User> & { uid: string }) {
    const { uid, ...data } = userObj;
    const email = data.email ? data.email.toLowerCase().trim() : undefined;

    if (!email && !data.phoneE164) {
      console.warn('saveUser: email or phone is required to create/update a profile');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUid = sessionData.session?.user?.id;
    const profileId = sessionUid || uid;

    const rpcParams: Record<string, unknown> = {
      p_email: email ?? null,
      p_display_name: data.displayName ?? null,
      p_avatar_url: data.avatarUrl ?? null,
      p_status: data.status ?? null,
    };
    if (data.username !== undefined) rpcParams.p_username = data.username.toLowerCase().trim();
    if (data.phoneE164 !== undefined) rpcParams.p_phone_e164 = data.phoneE164;
    if (data.bio !== undefined) rpcParams.p_bio = data.bio;
    if (data.publicKey !== undefined) rpcParams.p_public_key = data.publicKey;
    if (data.discoverableByPhone !== undefined) rpcParams.p_discoverable_by_phone = data.discoverableByPhone;
    if (data.phoneVisibility !== undefined) rpcParams.p_phone_visibility = data.phoneVisibility;
    if (data.usernameChangedAt !== undefined) rpcParams.p_username_changed_at = new Date(data.usernameChangedAt).toISOString();
    if (data.shareCodeChangedAt !== undefined) rpcParams.p_share_code_changed_at = new Date(data.shareCodeChangedAt).toISOString();

    const { error: rpcError } = await supabase.rpc('upsert_own_profile', rpcParams);

    if (!rpcError) {
      const extraUpdates: Record<string, unknown> = {};
      if (data.shareCode) extraUpdates.share_code = data.shareCode;
      if (Object.keys(extraUpdates).length > 0) {
        await supabase.from('profiles').update(extraUpdates).eq('id', profileId);
      }
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
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) patch.email = email;
    if (data.displayName !== undefined) patch.display_name = data.displayName;
    if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl;
    if (data.status !== undefined) patch.status = data.status;
    if (data.publicKey !== undefined) patch.public_key = data.publicKey;
    if (data.username !== undefined) patch.username = data.username.toLowerCase().trim();
    if (data.phoneE164 !== undefined) patch.phone_e164 = data.phoneE164;
    if (data.bio !== undefined) patch.bio = data.bio;
    if (data.shareCode !== undefined) patch.share_code = data.shareCode;
    if (data.usernameChangedAt !== undefined) patch.username_changed_at = new Date(data.usernameChangedAt).toISOString();
    if (data.shareCodeChangedAt !== undefined) patch.share_code_changed_at = new Date(data.shareCodeChangedAt).toISOString();
    if (data.verificationType !== undefined) patch.verification_type = data.verificationType;

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
      email: email ?? '',
      display_name: data.displayName ?? '',
      avatar_url: data.avatarUrl ?? '',
      status: data.status ?? 'Hey there! I am using NimbusX',
      public_key: data.publicKey ?? '',
      username: data.username?.toLowerCase().trim() ?? null,
      phone_e164: data.phoneE164 ?? null,
      bio: data.bio ?? null,
      share_code: data.shareCode ?? null,
      verification_type: 'none',
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('profiles').insert(insertRow);

    if (insertError) {
      console.error('Save user failed:', insertError);
      throw insertError;
    }
  },

  async addUsernameHistory(uid: string, oldUsername: string) {
    const { error } = await supabase
      .from('username_history')
      .insert({ user_id: uid, username: oldUsername.toLowerCase().trim() });

    if (error && error.code !== '23505') {
      console.error('Failed to record username history:', error);
    }
  },

  async getOldReservedUsernames(): Promise<Set<string>> {
    const { data, error } = await supabase.rpc('get_old_usernames');
    if (error || !data) return new Set();
    return new Set(data.map((r: any) => r.username));
  },

  async getUser(uid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error || !data) return null;

    if (data.public_key) {
      publicKeyCache[uid] = data.public_key;
    }

    return mapProfile(data);
  },

  async searchUserByUsername(username: string): Promise<User | null> {
    const normalized = username.toLowerCase().replace(/^@/, '').trim();
    const { data, error } = await supabase
      .rpc('search_profile_by_username', { p_username: normalized });

    if (error || !data || data.length === 0) return null;
    const profile = data[0];

    if (profile.public_key) {
      publicKeyCache[profile.id] = profile.public_key;
    }

    return mapProfile(profile);
  },

  async searchUsers(query: string, currentUid: string): Promise<User[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const profileFields = 'id, email, username, share_code, display_name, avatar_url, status, phone_e164, public_key, is_online, last_seen';

    if (trimmed.startsWith('@')) {
      const username = trimmed.slice(1).toLowerCase();
      const { data } = await supabase
        .from('profiles')
        .select(profileFields)
        .ilike('username', `${username}%`)
        .neq('id', currentUid)
        .limit(10);

      return (data || []).map(mapProfile);
    }

    if (trimmed.startsWith('NX') && trimmed.length >= 5) {
      const { data } = await supabase
        .from('profiles')
        .select(profileFields)
        .eq('share_code', trimmed.toUpperCase())
        .limit(5);

      return (data || []).map(mapProfile);
    }

    const phoneDigits = trimmed.replace(/\D/g, '');
    if (phoneDigits.length >= 7) {
      const { data } = await supabase
        .from('profiles')
        .select(profileFields)
        .ilike('phone_e164', `%${phoneDigits}`)
        .neq('id', currentUid)
        .limit(5);

      return (data || []).map(mapProfile);
    }

    const [{ data: byName }, { data: byUsername }] = await Promise.all([
      supabase
        .from('profiles')
        .select(profileFields)
        .ilike('display_name', `%${trimmed}%`)
        .neq('id', currentUid)
        .limit(10),
      supabase
        .from('profiles')
        .select(profileFields)
        .ilike('username', `%${trimmed}%`)
        .neq('id', currentUid)
        .limit(10),
    ]);

    const seen = new Set<string>();
    const results: User[] = [];
    for (const p of [...(byName || []), ...(byUsername || [])]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push(mapProfile(p));
      }
    }

    return results.slice(0, 20);
  },

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
      if (error.code === '23505') return;
      console.error('Add contact failed:', error);
      throw error;
    }
  },

  listenContacts(uid: string, callback: (contacts: User[]) => void) {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('profiles:contact_id(id, email, username, share_code, display_name, avatar_url, status, phone_e164, is_online, last_seen, public_key)')
        .eq('user_id', uid);

      if (!error && data) {
        const contacts = data
          .map((row: any) => {
            const p = row.profiles;
            if (!p) return null;
            return mapProfile(p);
          })
          .filter(Boolean) as User[];

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
        shared_with: status.sharedWith || [],
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

  listenStatuses(currentUid: string, callback: (statuses: Status[]) => void) {
    const fetchStatuses = async () => {
      const nowStr = new Date().toISOString();
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .gt('expires_at', nowStr)
        .or(`uid.eq.${currentUid},shared_with.cs.{${currentUid}}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const statuses = data.map((row: any) => ({
          id: row.id,
          uid: row.uid,
          displayName: row.display_name,
          avatarUrl: row.avatar_url || '',
          text: row.text || '',
          imageUrl: row.image_url,
          sharedWith: row.shared_with || [],
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
      .channel(`statuses-changes-${currentUid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses' },
        () => {
          fetchStatuses();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `user_id=eq.${currentUid}` },
        () => {
          fetchStatuses();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `contact_id=eq.${currentUid}` },
        () => {
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

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
      .update({ members, unread_count: unreadCount, typing, admins })
      .eq('id', chatId);

    if (updateError) {
      console.error('Remove member failed:', updateError);
      throw updateError;
    }
  },

  async leaveGroup(chatId: string, uid: string) {
    return this.removeGroupMember(chatId, uid);
  },

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
