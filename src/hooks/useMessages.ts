import { useEffect, useState } from 'react';
import { useAppDispatch } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { setMessages, setMessagesLoading } from '@store/slices/messageSlice';
import { PAGINATION } from '@constants';

export const useMessages = (chatId: string) => {
  const dispatch = useAppDispatch();
  const [limit, setLimit] = useState(PAGINATION.MESSAGES_PER_PAGE);

  useEffect(() => {
    if (!chatId) return;

    dispatch(setMessagesLoading({ chatId, loading: true }));
    const unsubscribe = firestoreService.listenMessages(chatId, limit, (messages) => {
      dispatch(setMessages(messages));
      dispatch(setMessagesLoading({ chatId, loading: false }));
    });

    return () => unsubscribe();
  }, [chatId, limit, dispatch]);

  const loadMore = () => {
    setLimit((prev) => prev + PAGINATION.MESSAGES_PER_PAGE);
  };

  return { loadMore };
};
