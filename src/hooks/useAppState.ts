import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppSelector } from '@store/hooks';
import { presenceService } from '@services/firebase/presence';

export const useAppState = () => {
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const isOnline = nextAppState === 'active';
      presenceService.setPresence(user.uid, isOnline);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);
};
