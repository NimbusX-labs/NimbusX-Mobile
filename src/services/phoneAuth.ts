import { supabase } from '../config/supabase';

export interface PhoneAuthResult {
  success: boolean;
  sessionId?: string;
  uid?: string;
}

export interface PhoneAuthProvider {
  sendOTP(phoneNumber: string): Promise<PhoneAuthResult>;
  verifyOTP(phoneNumber: string, code: string, sessionId?: string): Promise<PhoneAuthResult>;
}

class MockOTPProvider implements PhoneAuthProvider {
  private otpStore: Map<string, { code: string; expiresAt: number }> = new Map();

  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    const code = '123456';
    this.otpStore.set(phoneNumber, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    console.log(`[MockOTP] Code for ${phoneNumber}: ${code}`);
    return { success: true, sessionId: phoneNumber };
  }

  async verifyOTP(phoneNumber: string, code: string, _sessionId?: string): Promise<PhoneAuthResult> {
    const stored = this.otpStore.get(phoneNumber);
    if (!stored || stored.code !== code) {
      return { success: false };
    }
    if (Date.now() > stored.expiresAt) {
      return { success: false };
    }
    this.otpStore.delete(phoneNumber);
    return { success: true };
  }
}

class FirebasePhoneAuthProvider implements PhoneAuthProvider {
  async sendOTP(_phoneNumber: string): Promise<PhoneAuthResult> {
    throw new Error('Firebase Phone Auth not yet configured');
  }

  async verifyOTP(_phoneNumber: string, _code: string, _sessionId?: string): Promise<PhoneAuthResult> {
    throw new Error('Firebase Phone Auth not yet configured');
  }
}

class SupabasePhoneAuthProvider implements PhoneAuthProvider {
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });
    if (error) throw error;
    return { success: true, sessionId: normalizedPhone };
  }

  async verifyOTP(phoneNumber: string, code: string, _sessionId?: string): Promise<PhoneAuthResult> {
    const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: code,
      type: 'sms',
    });
    if (error) return { success: false };
    return { success: true, uid: data.user?.id };
  }
}

let activeProvider: PhoneAuthProvider;

const getProvider = (): PhoneAuthProvider => {
  if (!activeProvider) {
    const providerType = process.env.PHONE_AUTH_PROVIDER || 'mock';
    switch (providerType) {
      case 'firebase':
        activeProvider = new FirebasePhoneAuthProvider();
        break;
      case 'supabase':
        activeProvider = new SupabasePhoneAuthProvider();
        break;
      case 'mock':
      default:
        activeProvider = new MockOTPProvider();
        break;
    }
  }
  return activeProvider;
};

export const phoneAuthService = {
  setProvider(provider: 'mock' | 'firebase' | 'supabase') {
    switch (provider) {
      case 'firebase':
        activeProvider = new FirebasePhoneAuthProvider();
        break;
      case 'supabase':
        activeProvider = new SupabasePhoneAuthProvider();
        break;
      case 'mock':
      default:
        activeProvider = new MockOTPProvider();
        break;
    }
  },

  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    return getProvider().sendOTP(phoneNumber);
  },

  async verifyOTP(phoneNumber: string, code: string, sessionId?: string): Promise<PhoneAuthResult> {
    return getProvider().verifyOTP(phoneNumber, code, sessionId);
  },
};
