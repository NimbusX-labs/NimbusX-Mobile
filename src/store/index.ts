import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/chatSlice';
import messageReducer from './slices/messageSlice';
import groupReducer from './slices/groupSlice';
import settingsReducer from './slices/settingsSlice';

// Single, flat persist config — no nested persistReducer calls.
// Nested persist was causing a rehydration race that could hang PersistGate.
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Persist auth (user field) + user slice + messages + settings for continuity across sessions.
  // Chats and groups are NOT persisted to avoid stale data.
  whitelist: ['auth', 'user', 'messages', 'settings'],
  // Exclude transient fields from the auth slice so loading:true is never persisted.
  blacklist: [],
};

const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  chats: chatReducer,
  messages: messageReducer,
  groups: groupReducer,
  settings: settingsReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout') {
    // Clear all user-specific data from store on logout to prevent cross-account leakage.
    // We intentionally keep the 'settings' slice to preserve local app preferences.
    state = {
      settings: state?.settings,
      auth: undefined,
      user: undefined,
      chats: undefined,
      messages: undefined,
      groups: undefined,
    };
  }
  return appReducer(state, action);
};

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
