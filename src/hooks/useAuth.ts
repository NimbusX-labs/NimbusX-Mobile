import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { authService } from '@services/supabase/auth';
import { firestoreService } from '@services/supabase/database';
import { setUser, setLoading, setError, logout } from '@store/slices/authSlice';
import { upsertUser } from '@store/slices/userSlice';

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

  const register = useCallback(async (email: string, password: string, displayName: string, username?: string) => {
    dispatch(setLoading(true));
    try {
      const firebaseUser = await authService.registerWithEmail(email, password, displayName, username);
      if (firebaseUser) {
        await firestoreService.saveUser({
          uid: firebaseUser.uid,
          email: email,
          username: username,
          displayName: displayName,
          avatarUrl: '',
        });

        dispatch(setUser({
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: email,
          username: username,
          displayName: displayName,
          avatarUrl: '',
        }));

        if (username) {
          dispatch(upsertUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            username: username.toLowerCase().trim(),
            displayName: displayName,
          } as any));
        }
      }
      return firebaseUser;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const sendPhoneOTP = useCallback(async (phoneNumber: string) => {
    dispatch(setLoading(true));
    try {
      const result = await authService.signInWithPhone(phoneNumber);
      return result;
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const verifyPhoneOTP = useCallback(async (phoneNumber: string, code: string, sessionId?: string) => {
    dispatch(setLoading(true));
    try {
      const result = await authService.verifyPhoneOTP(phoneNumber, code, sessionId);
      if (result.success && result.uid) {
        const profile = await firestoreService.getUser(result.uid);
        if (profile) {
          dispatch(setUser({
            uid: result.uid,
            id: result.uid,
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            username: profile.username,
            phoneE164: profile.phoneE164,
          }));
        }
      }
      return result;
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
    sendPhoneOTP,
    verifyPhoneOTP,
    signOut,
    resetPassword,
  };
};
