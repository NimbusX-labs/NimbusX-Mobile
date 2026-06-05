import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { Chat } from '@types';
import { RootState } from '../index';

const chatAdapter = createEntityAdapter<Chat>({
  sortComparer: (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0),
});

const chatSlice = createSlice({
  name: 'chats',
  initialState: chatAdapter.getInitialState({
    loading: false,
    error: null as string | null,
  }),
  reducers: {
    upsertChats: chatAdapter.upsertMany,
    upsertChat: chatAdapter.upsertOne,
    removeChat: chatAdapter.removeOne,
    setChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setChatsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAllChats: (state) => {
      chatAdapter.removeAll(state);
    },
  },
});

export const { upsertChats, upsertChat, removeChat, setChatsLoading, setChatsError, clearAllChats } = chatSlice.actions;

export const chatSelectors = chatAdapter.getSelectors<RootState>(
  (state) => state.chats
);

export default chatSlice.reducer;
