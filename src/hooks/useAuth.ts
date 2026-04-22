import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { authService } from '@services/firebase/auth';
import { firestoreService } from '@services/firebase/firestore';
import { setUser, setLoading, setError, logout } from '@store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const login = useCallback(async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      // Let onAuthStateChanged handle the actual Redux user setting
      // but we return it here just in case components need immediate response
      return firebaseUser;
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
      const firebaseUser = await authService.registerWithEmail(email, password);
      if (firebaseUser) {
        // Try to update profile with displayName
        await firebaseUser.updateProfile({ displayName });
        
        // Explicitly save the user profile to Firestore immediately to fix the race condition
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
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    login,
    register,
    signOut,
  };
};
