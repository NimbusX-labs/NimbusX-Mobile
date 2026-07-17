import { supabase } from '../config/supabase';
import { PhoneVisibility, ProfileVisibility } from '@types';

export interface PrivacySettings {
  discoverableByPhone: boolean;
  phoneVisibility: PhoneVisibility;
  profilePhotoVisibility: ProfileVisibility;
  lastSeenVisibility: ProfileVisibility;
  statusVisibility: ProfileVisibility;
  readReceipts: boolean;
  typingIndicator: boolean;
}

export const privacyService = {
  async getPrivacySettings(uid: string): Promise<PrivacySettings | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'discoverable_by_phone, phone_visibility, profile_photo_visibility, last_seen_visibility, status_visibility, read_receipts, typing_indicator'
      )
      .eq('id', uid)
      .maybeSingle();

    if (error || !data) return null;

    return {
      discoverableByPhone: data.discoverable_by_phone ?? true,
      phoneVisibility: data.phone_visibility || 'everyone',
      profilePhotoVisibility: data.profile_photo_visibility || 'everyone',
      lastSeenVisibility: data.last_seen_visibility || 'everyone',
      statusVisibility: data.status_visibility || 'everyone',
      readReceipts: data.read_receipts ?? true,
      typingIndicator: data.typing_indicator ?? true,
    };
  },

  async updatePrivacySettings(
    uid: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (settings.discoverableByPhone !== undefined) updates.discoverable_by_phone = settings.discoverableByPhone;
    if (settings.phoneVisibility !== undefined) updates.phone_visibility = settings.phoneVisibility;
    if (settings.profilePhotoVisibility !== undefined) updates.profile_photo_visibility = settings.profilePhotoVisibility;
    if (settings.lastSeenVisibility !== undefined) updates.last_seen_visibility = settings.lastSeenVisibility;
    if (settings.statusVisibility !== undefined) updates.status_visibility = settings.statusVisibility;
    if (settings.readReceipts !== undefined) updates.read_receipts = settings.readReceipts;
    if (settings.typingIndicator !== undefined) updates.typing_indicator = settings.typingIndicator;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', uid);

    if (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  },

  canViewPhone(_requestorUid: string, _targetUid: string, targetSettings: PrivacySettings): boolean {
    if (targetSettings.phoneVisibility === 'everyone') return true;
    if (targetSettings.phoneVisibility === 'nobody') return false;
    return true;
  },

  canViewProfilePhoto(_requestorUid: string, _targetUid: string, targetSettings: PrivacySettings): boolean {
    if (targetSettings.profilePhotoVisibility === 'everyone') return true;
    if (targetSettings.profilePhotoVisibility === 'nobody') return false;
    return true;
  },

  canViewLastSeen(_requestorUid: string, _targetUid: string, targetSettings: PrivacySettings): boolean {
    if (targetSettings.lastSeenVisibility === 'everyone') return true;
    if (targetSettings.lastSeenVisibility === 'nobody') return false;
    return true;
  },

  canViewStatus(_requestorUid: string, _targetUid: string, targetSettings: PrivacySettings): boolean {
    if (targetSettings.statusVisibility === 'everyone') return true;
    if (targetSettings.statusVisibility === 'nobody') return false;
    return true;
  },
};
