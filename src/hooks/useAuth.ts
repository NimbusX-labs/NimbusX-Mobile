import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { authService } from '@services/supabase/auth';
import { firestoreService } from '@services/supabase/database';
import { setUser, setLoading, setError, logout } from '@store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const login = useCallback(async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      if (firebaseUser) {
        await firestoreService.saveUser({
          uid: firebaseUser.uid,
          email: email.trim().toLowerCase(),
          displayName: firebaseUser.displayName || '',
          avatarUrl: firebaseUser.avatarUrl || '',
        });
      }
      return firebaseUser;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loginWithGoogle = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const googleUser = await authService.signInWithGoogle();
      return googleUser;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    dispatch(setLoading(true));
    try {
      const firebaseUser = await authService.registerWithEmail(email, password, displayName);
      if (firebaseUser) {
        // Explicitly save the user profile to database immediately to fix the race condition
        await firestoreService.saveUser({
          uid: firebaseUser.uid,
          email: email,
          displayName: displayName,
          avatarUrl: '',
        });
        
        // Update local Redux state immediately
        dispatch(setUser({
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: email,
          displayName: displayName,
          avatarUrl: '',
        }));
      }
      return firebaseUser;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      dispatch(logout());
      // Purge all persisted data so contacts/messages don't leak to the next account
      const { persistor } = require('@store/index');
      await persistor.purge();
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  }, [dispatch]);

  const resetPassword = useCallback(async (email: string) => {
    dispatch(setLoading(true));
    try {
      await authService.resetPassword(email);
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    signOut,
    resetPassword,
  };
};

