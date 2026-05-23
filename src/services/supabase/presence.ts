import { supabase } from '../../config/supabase';

export const presenceService = {
  /**
   * Set up presence tracking for a user
   */
  setupPresence(uid: string) {
    // Mark as online in the database
    this.setPresence(uid, true);

    // Subscribe to a realtime channel to keep the connection alive
    const channel = supabase.channel(`online-status:${uid}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Update presence manually (e.g., on AppState change)
   */
  async setPresence(uid: string, isOnline: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', uid);

    if (error) {
      console.error('Supabase Presence: setPresence error', error);
    }
  },

  /**
   * Listen to another user's presence
   */
  listenToUserPresence(uid: string, callback: (data: any) => void) {
    const fetchPresence = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online, last_seen')
        .eq('id', uid)
        .maybeSingle();

      if (!error && data) {
        callback({
          state: data.is_online ? 'online' : 'offline',
          last_changed: data.last_seen ? new Date(data.last_seen).getTime() : Date.now(),
        });
      }
    };

    fetchPresence();

    const channel = supabase
      .channel(`presence-listener-${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${uid}`,
        },
        (payload) => {
          const newData = payload.new;
          callback({
            state: newData.is_online ? 'online' : 'offline',
            last_changed: newData.last_seen ? new Date(newData.last_seen).getTime() : Date.now(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
