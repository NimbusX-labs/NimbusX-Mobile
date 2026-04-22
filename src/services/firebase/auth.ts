import auth from '@react-native-firebase/auth';

export const authService = {
  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Firebase Auth: signIn error', error);
      throw error;
    }
  },

  /**
   * Create account with Email and Password
   */
  async registerWithEmail(email: string, password: string) {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Firebase Auth: register error', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Firebase Auth: signOut error', error);
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth().currentUser;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  },
};
