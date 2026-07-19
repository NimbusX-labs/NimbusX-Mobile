import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { upsertChats, removeChat, setChatsLoading } from '@store/slices/chatSlice';
import { Chat } from '@types';

/**
 * For 1-on-1 chats, generates a stable key from the two member UIDs
 * regardless of their order in the array.
 */
function pairKey(chat: Chat): string | null {
  if (chat.type !== 'one-to-one' || !chat.members || chat.members.length < 2) return null;
  return [...chat.members].sort().join('|');
}

/**
 * Deduplicates 1-on-1 chats: for each unique pair of members,
 * keeps the most recent chat (largest lastMessageAt or createdAt)
 * and schedules the older duplicates for deletion.
 */
function deduplicateChats(chats: Chat[], onDeleteIds: (ids: string[]) => void): Chat[] {
  const seen = new Map<string, Chat>();
  const toDelete: string[] = [];

  for (const chat of chats) {
    const key = pairKey(chat);
    if (!key) continue; // groups — skip

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, chat);
    } else {
      // Keep whichever has the newer lastMessageAt; delete the older one
      const chatTime = chat.lastMessageAt || 0;
      const existingTime = existing.lastMessageAt || 0;
      if (chatTime >= existingTime) {
        toDelete.push(existing.id);
        seen.set(key, chat);
      } else {
        toDelete.push(chat.id);
      }
    }
  }

  if (toDelete.length > 0) {
    onDeleteIds(toDelete);
  }

  // Build final list: keep all groups + de-duped 1-to-1s
  const groups = chats.filter(c => c.type !== 'one-to-one');
  return [...groups, ...Array.from(seen.values())];
}

export const useChats = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [error, setError] = useState<string | null>(null);
  const loading = useAppSelector((state) => state.chats.loading);

  useEffect(() => {
    if (!user) return;

    dispatch(setChatsLoading(true));
    try {
      const unsubscribe = firestoreService.listenUserChats(user.uid, (chats: Chat[]) => {
        setError(null);
        const deduped = deduplicateChats(chats, (idsToDelete) => {
          idsToDelete.forEach(id => dispatch(removeChat(id)));
          idsToDelete.forEach(id => {
            firestoreService.deleteChat(id).catch(err =>
              console.warn('Failed to delete duplicate chat:', id, err)
            );
          });
        });

        dispatch(upsertChats(deduped));
        dispatch(setChatsLoading(false));
      });
      return () => unsubscribe();
    } catch {
      setError('Failed to load chats');
      dispatch(setChatsLoading(false));
    }
  }, [user, dispatch]);

  return { loading, error };
};
