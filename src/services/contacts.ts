import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { normalizeToE164 } from '../utils/phone';
import { supabase } from '../config/supabase';
import { ProcessedContact, ContactMatch } from '@types';

interface ContactsApiResponse {
  name: string;
  phones: string[];
}

const requestPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'NimbusX Contacts',
          message: 'NimbusX needs access to your contacts to find friends who are on NimbusX',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  if (Platform.OS === 'ios') {
    await Linking.openSettings();
    return true;
  }
  return false;
};

const getContactsFromDevice = async (): Promise<ContactsApiResponse[]> => {
  try {
    const Contacts = require('react-native-contacts');
    const contactList = await Contacts.getAll();
    return contactList.map((c: any) => ({
      name: c.displayName || `${c.givenName || ''} ${c.familyName || ''}`.trim(),
      phones: c.phoneNumbers?.map((p: any) => p.number) || [],
    }));
  } catch {
    console.warn('react-native-contacts not available, using mock contacts');
    return [];
  }
};

export const contactsService = {
  async requestPermission(): Promise<boolean> {
    return requestPermission();
  },

  async syncContacts(): Promise<{
    matched: ContactMatch[];
    notOnNimbusX: ProcessedContact[];
  }> {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return { matched: [], notOnNimbusX: [] };
    }

    const deviceContacts: ContactsApiResponse[] = await getContactsFromDevice();

    const processed: ProcessedContact[] = [];
    for (const contact of deviceContacts) {
      for (const rawPhone of contact.phones) {
        const e164 = normalizeToE164(rawPhone);
        if (e164) {
          processed.push({ rawName: contact.name, e164, hash: '' });
        }
      }
    }

    const e164Numbers = processed
      .map(p => p.e164)
      .filter((n): n is string => n !== null);

    if (e164Numbers.length === 0) {
      return { matched: [], notOnNimbusX: processed };
    }

    const { data, error } = await supabase
      .rpc('match_contacts_by_phone', { phone_numbers: e164Numbers });

    if (error) {
      console.error('Contact matching failed:', error);
      const fallbackMatch = await this.matchContactsLocally(e164Numbers);
      return { matched: fallbackMatch, notOnNimbusX: [] };
    }

    const matchedE164s = new Set((data || []).map((m: any) => m.phone_e164));
    const matched: ContactMatch[] = (data || []).map((m: any) => ({
      uid: m.id,
      username: m.username,
      shareCode: m.share_code,
      displayName: m.display_name || m.username || 'Unknown',
      avatarUrl: m.avatar_url || '',
      phoneE164: m.phone_e164,
      verificationType: m.verification_type || 'none',
    }));

    const notOnNimbusX = processed.filter(p => p.e164 && !matchedE164s.has(p.e164));

    return { matched, notOnNimbusX };
  },

  async matchContactsLocally(phoneNumbers: string[]): Promise<ContactMatch[]> {
    if (phoneNumbers.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, share_code, display_name, avatar_url, phone_e164')
      .in('phone_e164', phoneNumbers)
      .eq('discoverable_by_phone', true);

    if (error) {
      console.error('Local contact match failed:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      uid: p.id,
      username: p.username,
      shareCode: p.share_code,
      displayName: p.display_name || p.username || 'Unknown',
      avatarUrl: p.avatar_url || '',
      phoneE164: p.phone_e164,
    }));
  },
};
