import { useEffect } from 'react';
import { useAppSelector } from '@store/hooks';
import { presenceService } from '@services/supabase/presence';

export const usePresence = () => {
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    presenceService.setupPresence(user.uid);
  }, [user]);

  const listenToPresence = (uid: string, callback: (data: any) => void) => {
    return presenceService.listenToUserPresence(uid, callback);
  };

  return { listenToPresence };
};
