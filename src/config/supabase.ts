import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// TODO: Replace with your actual Supabase URL and Anon Key
export const SUPABASE_URL = 'https://unkrlzohmijbbznyxflp.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_XTBes8bzeBBrXp49tR3-vw_JMYbNQg6';
export const GOOGLE_WEB_CLIENT_ID = '748106728814-e0khqep9k4rb6niibfr11mnglvur4a58.apps.googleusercontent.com';

// Configure Google Sign-In with Web Client ID
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh session when app comes to foreground, stop when backgrounded
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
