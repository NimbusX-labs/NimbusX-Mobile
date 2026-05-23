import { supabase } from '../../config/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Map Supabase user structure to match Firebase user properties (e.g. uid)
const mapUser = (supabaseUser: any) => {
  if (!supabaseUser) return null;
  const userMetadata = supabaseUser.user_metadata || {};
  const displayName = userMetadata.displayName || userMetadata.full_name || userMetadata.name || supabaseUser.email || '';
  const avatarUrl = userMetadata.avatarUrl || userMetadata.avatar_url || userMetadata.picture || '';

  return {
    ...supabaseUser,
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName,
    avatarUrl,
  };
};

export const authService = {
  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('GoogleSignin.signIn returned:', JSON.stringify(userInfo));
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) {
        throw new Error(`No ID token present from Google Sign-In. Response: ${JSON.stringify(userInfo)}`);
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      return mapUser(data.user);
    } catch (error) {
      console.error('Supabase Auth: Google Sign-In error', error);
      throw error;
    }
  },

  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return mapUser(data.user);
    } catch (error) {
      console.error('Supabase Auth: signIn error', error);
      throw error;
    }
  },

  /**
   * Create account with Email and Password
   */
  async registerWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return mapUser(data.user);
    } catch (error) {
      console.error('Supabase Auth: register error', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Supabase Auth: signOut error', error);
      throw error;
    }
  },

  /**
   * Get current user (unused in app, but kept for interface completeness)
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return mapUser(data.user);
    } catch {
      return null;
    }
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback: (user: any) => void) {
    // Get initial session and trigger callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      callback(mapUser(session?.user ?? null));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        callback(mapUser(session?.user ?? null));
      }
    );
    return () => subscription.unsubscribe();
  },
};
