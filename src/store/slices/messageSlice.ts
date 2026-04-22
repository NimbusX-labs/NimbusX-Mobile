import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '@types';
import { RootState } from '../index';

const messageAdapter = createEntityAdapter<Message>({
  sortComparer: (a, b) => b.createdAt - a.createdAt, // Recents first
});

const messageSlice = createSlice({
  name: 'messages',
  initialState: messageAdapter.getInitialState({
    offlineQueue: [] as Message[],
  }),
  reducers: {
    upsertMessages: messageAdapter.upsertMany,
    upsertMessage: messageAdapter.upsertOne,
    removeMessage: messageAdapter.removeOne,
    addToOfflineQueue: (state, action: PayloadAction<Message>) => {
      state.offlineQueue.push(action.payload);
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    setMessagesLoading: (_state, _action: PayloadAction<{ chatId: string; loading: boolean }>) => {
      // For MVP, we can just keep track of loading status if needed,
      // or simply ignore it if we're using optimistic updates.
      // Here we'll just acknowledge the action for Type consistency.
    },
    clearAllMessages: (state) => {
      messageAdapter.removeAll(state);
      state.offlineQueue = [];
    },
  },
});

export const {
  upsertMessages,
  upsertMessage,
  removeMessage,
  addToOfflineQueue,
  clearOfflineQueue,
  setMessagesLoading,
  clearAllMessages
} = messageSlice.actions;

export const messagesSelectors = messageAdapter.getSelectors<RootState>(
  (state) => state.messages
);

export default messageSlice.reducer;
