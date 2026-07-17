export const QR_CODE_PREFIX = 'nimbusx://user/';

export const qrCodeService = {
  encodeUsername(username: string): string {
    const normalized = username.toLowerCase().replace(/^@/, '').trim();
    return `${QR_CODE_PREFIX}${normalized}`;
  },

  encodeShareCode(shareCode: string): string {
    return `${QR_CODE_PREFIX}${shareCode}`;
  },

  decodeQRCode(data: string): { username?: string; shareCode?: string } | null {
    if (!data.startsWith(QR_CODE_PREFIX)) return null;
    const code = data.replace(QR_CODE_PREFIX, '').trim();
    if (!code) return null;

    if (code.startsWith('NX') && code.length >= 5) {
      return { shareCode: code };
    }

    return { username: code };
  },

  async generateQRCode(username: string): Promise<string> {
    const payload = this.encodeUsername(username);
    try {
      const QRCode = require('qrcode');
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return dataUrl;
    } catch {
      return payload;
    }
  },

  async generateQRCodeForShareCode(shareCode: string): Promise<string> {
    const payload = this.encodeShareCode(shareCode);
    try {
      const QRCode = require('qrcode');
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return dataUrl;
    } catch {
      return payload;
    }
  },

  getProfileLink(username: string): string {
    const normalized = username.toLowerCase().replace(/^@/, '').trim();
    return `https://nimbusx.app/u/${normalized}`;
  },

  getShareCodeLink(shareCode: string): string {
    return `https://nimbusx.app/p/${shareCode}`;
  },

  getUserProfileLink(user: { username?: string | null; shareCode?: string | null }): string {
    if (user.username) {
      return this.getProfileLink(user.username);
    }
    return this.getShareCodeLink(user.shareCode ?? '');
  },

  getDeepLink(usernameOrCode: string): string {
    const cleaned = usernameOrCode.trim();
    if (cleaned.startsWith('NX') && cleaned.length >= 5) {
      return `nimbusx://user/${cleaned}`;
    }
    const normalized = cleaned.replace(/^@/, '').toLowerCase();
    return `nimbusx://user/${normalized}`;
  },
};
