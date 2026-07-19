import { supabase } from '../config/supabase';
import { SearchResult } from '@types';
import { normalizeToE164 } from '../utils/phone';
import { stripAtSymbol } from '../utils/username';

export const searchService = {
  async searchUsers(query: string, currentUid: string): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const results: SearchResult[] = [];
    const seenUids = new Set<string>();

    const addResult = (profile: any): SearchResult | null => {
      if (!profile || seenUids.has(profile.id) || profile.id === currentUid) return null;
      seenUids.add(profile.id);
      return {
        uid: profile.id,
        username: profile.username,
        shareCode: profile.share_code,
        displayName: profile.display_name || profile.username || 'Unknown',
        avatarUrl: profile.avatar_url || '',
        phoneE164: profile.phone_e164,
        verificationType: profile.verification_type || 'none',
        isContact: false,
      };
    };

    if (trimmed.startsWith('@')) {
      const username = stripAtSymbol(trimmed).toLowerCase();
      const [{ data: exactData }, { data: fuzzyData }] = await Promise.all([
        supabase.rpc('search_profile_by_username', { p_username: username }),
        supabase
          .from('profiles')
          .select('id, username, share_code, display_name, avatar_url, phone_e164, verification_type')
          .ilike('username', `${username}%`)
          .neq('id', currentUid)
          .limit(10),
      ]);
      for (const profile of exactData || []) {
        const r = addResult(profile);
        if (r) results.push(r);
      }
      for (const profile of fuzzyData || []) {
        const r = addResult(profile);
        if (r) results.push(r);
      }
      return results;
    }

    if (trimmed.startsWith('NX') && trimmed.length >= 5) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, share_code, display_name, avatar_url, phone_e164')
        .eq('share_code', trimmed.toUpperCase())
        .limit(5);

      for (const profile of data || []) {
        const r = addResult(profile);
        if (r) results.push(r);
      }
      if (results.length > 0) return results;
    }

    const phoneE164 = normalizeToE164(trimmed);
    if (phoneE164) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, share_code, display_name, avatar_url, phone_e164')
        .eq('phone_e164', phoneE164)
        .limit(5);

      for (const profile of data || []) {
        const r = addResult(profile);
        if (r) results.push(r);
      }
      return results;
    }

    const [{ data: byName }, { data: byUsername }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, share_code, display_name, avatar_url, phone_e164')
        .ilike('display_name', `%${trimmed}%`)
        .neq('id', currentUid)
        .limit(10),
      supabase
        .from('profiles')
        .select('id, username, share_code, display_name, avatar_url, phone_e164')
        .ilike('username', `%${trimmed}%`)
        .neq('id', currentUid)
        .limit(10),
    ]);

    for (const profile of [...(byName || []), ...(byUsername || [])]) {
      const r = addResult(profile);
      if (r) results.push(r);
    }

    return results.slice(0, 20);
  },

  async searchByUsername(username: string): Promise<SearchResult | null> {
    const normalized = username.toLowerCase().replace(/^@/, '').trim();
    if (normalized.length < 2) return null;

    const { data, error } = await supabase
      .rpc('search_profile_by_username', { p_username: normalized });

    if (error || !data || data.length === 0) return null;
    const profile = data[0];

    return {
      uid: profile.id,
      username: profile.username,
      shareCode: profile.share_code,
      displayName: profile.display_name || profile.username || 'Unknown',
      avatarUrl: profile.avatar_url || '',
      phoneE164: profile.phone_e164,
      isContact: false,
    };
  },

  async searchByShareCode(shareCode: string): Promise<SearchResult | null> {
    const code = shareCode.toUpperCase().trim();
    if (code.length < 5) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, share_code, display_name, avatar_url, phone_e164')
      .eq('share_code', code)
      .maybeSingle();

    if (error || !data) return null;

    return {
      uid: data.id,
      username: data.username,
      shareCode: data.share_code,
      displayName: data.display_name || data.username || 'Unknown',
      avatarUrl: data.avatar_url || '',
      phoneE164: data.phone_e164,
      isContact: false,
    };
  },
};
