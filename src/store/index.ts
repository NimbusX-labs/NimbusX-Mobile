import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/chatSlice';
import messageReducer from './slices/messageSlice';
import groupReducer from './slices/groupSlice';

// Single, flat persist config — no nested persistReducer calls.
// Nested persist was causing a rehydration race that could hang PersistGate.
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Persist auth (user field) + user slice + messages for continuity across sessions.
  // Chats and groups are NOT persisted to avoid stale data.
  whitelist: ['auth', 'user', 'messages'],
  // Exclude transient fields from the auth slice so loading:true is never persisted.
  blacklist: [],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  chats: chatReducer,
  messages: messageReducer,
  groups: groupReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist action types that carry non-serializable payloads
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
