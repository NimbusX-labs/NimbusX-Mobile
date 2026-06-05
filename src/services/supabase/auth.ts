import { supabase } from '../../config/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const normalizeAuthError = (error: unknown): Error => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message)
        : 'Something went wrong. Please try again.';

  if (/invalid login credentials/i.test(raw)) {
    return new Error(
      'Wrong email or password. Use the same account you registered in this app (Supabase), not an old Firebase login.',
    );
  }
  if (/email not confirmed/i.test(raw)) {
    return new Error('Please confirm your email from the signup message, then try again.');
  }
  if (/user already registered/i.test(raw)) {
    return new Error('An account with this email already exists. Try logging in instead.');
  }

  return new Error(raw);
};

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
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      return mapUser(data.user);
    } catch (error) {
      console.error('Supabase Auth: signIn error', error);
      throw normalizeAuthError(error);
    }
  },

  /**
   * Create account with Email and Password
   */
  async registerWithEmail(email: string, password: string, displayName?: string) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            displayName: displayName?.trim() || normalizedEmail,
            avatarUrl: '',
          },
        },
      });
      if (error) throw error;
      return mapUser(data.user);
    } catch (error) {
      console.error('Supabase Auth: register error', error);
      throw normalizeAuthError(error);
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
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        callback(mapUser(session?.user ?? null));
      })
      .catch((err) => {
        console.error('Supabase Auth: getSession failed', err);
        callback(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        callback(mapUser(session?.user ?? null));
      }
    );
    return () => subscription.unsubscribe();
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'nimbusx://reset-password',
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase Auth: resetPassword error', error);
      throw normalizeAuthError(error);
    }
  },
};

