import { Linking, Platform } from 'react-native';
import { InvitePayload } from '@types';

const INVITE_MESSAGE =
  "Join me on NimbusX!\n\nPrivate. Real-time. End-to-end encrypted.\n\nhttps://nimbusx.app/download";

export const inviteService = {
  async sendSMS({ phoneNumber, message }: InvitePayload) {
    const body = encodeURIComponent(message || INVITE_MESSAGE);
    const url = Platform.OS === 'android'
      ? `sms:${phoneNumber}?body=${body}`
      : `sms:${phoneNumber}&body=${body}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      throw new Error('SMS not available on this device');
    }
  },

  async shareInviteLink() {
    const message = INVITE_MESSAGE;
    const supported = await Linking.canOpenURL('sms:');
    if (supported) {
      await Linking.openURL(
        Platform.OS === 'android'
          ? `sms:?body=${encodeURIComponent(message)}`
          : `sms:&body=${encodeURIComponent(message)}`
      );
    } else {
      throw new Error('SMS not available on this device');
    }
  },

  getInviteMessage(username?: string): string {
    if (username) {
      return `Join me on NimbusX!\n\nMy profile: nimbusx://user/${username}\n\nhttps://nimbusx.app/download`;
    }
    return INVITE_MESSAGE;
  },

  generateInviteLink(username: string): string {
    return `https://nimbusx.app/@${username}`;
  },
};
