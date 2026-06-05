import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@types';

export type StorageMode = 'local' | 'cloud';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  storageMode: StorageMode | null; // null = not yet chosen (triggers onboarding)
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  storageMode: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setStorageMode: (state, action: PayloadAction<StorageMode>) => {
      state.storageMode = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      // NOTE: storageMode is intentionally preserved through logout.
      // In Local mode, chats persist on-device. The user's storage
      // preference survives logout and is only cleared on uninstall
      // or manual account wipe.
    },
  },
});

export const { setUser, setLoading, setError, setStorageMode, logout } = authSlice.actions;
export default authSlice.reducer;
