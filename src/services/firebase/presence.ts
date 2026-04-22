import database from '@react-native-firebase/database';
import { COLLECTIONS } from '@constants';

export const presenceService = {
  /**
   * Set up presence tracking for a user
   */
  setupPresence(uid: string) {
    const userStatusDatabaseRef = database().ref(`/${COLLECTIONS.PRESENCE}/${uid}`);

    const isOfflineData = {
      state: 'offline',
      last_changed: database.ServerValue.TIMESTAMP,
    };

    const isOnlineData = {
      state: 'online',
      last_changed: database.ServerValue.TIMESTAMP,
    };

    database()
      .ref('.info/connected')
      .on('value', (snapshot) => {
        if (snapshot.val() === false) {
          return;
        }

        userStatusDatabaseRef
          .onDisconnect()
          .set(isOfflineData)
          .then(() => {
            userStatusDatabaseRef.set(isOnlineData);
          });
      });
  },

  /**
   * Update presence manually (e.g., on AppState change)
   */
  async setPresence(uid: string, isOnline: boolean) {
    const userStatusDatabaseRef = database().ref(`/${COLLECTIONS.PRESENCE}/${uid}`);
    return userStatusDatabaseRef.set({
      state: isOnline ? 'online' : 'offline',
      last_changed: database.ServerValue.TIMESTAMP,
    });
  },

  /**
   * Listen to another user's presence
   */
  listenToUserPresence(uid: string, callback: (data: any) => void) {
    const ref = database().ref(`/${COLLECTIONS.PRESENCE}/${uid}`);
    ref.on('value', (snapshot) => {
      callback(snapshot.val());
    });
    return () => ref.off('value');
  },
};
