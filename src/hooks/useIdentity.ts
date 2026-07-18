import { useCallback, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import {
  validateUsername, normalizeUsername, RESERVED_USERNAMES,
  canChangeUsername, suggestUsernames,
} from '../utils/username';
import { normalizeToE164, formatPhoneForDisplay } from '../utils/phone';
import { generateShareCode, canRegenerateShareCode } from '../utils/shareCode';
import { firestoreService } from '../services/supabase/database';
import { contactsService } from '../services/contacts';
import { searchService } from '../services/search';
import { inviteService } from '../services/invite';
import { privacyService, PrivacySettings } from '../services/privacy';
import { qrCodeService } from '../services/qrcode';
import { upsertUser } from '@store/slices/userSlice';
import { SearchResult } from '@types';

export const useIdentity = () => {
  const dispatch = useAppDispatch();
  const [syncing, setSyncing] = useState(false);

  const setUsername = useCallback(async (uid: string, username: string, currentUsername?: string, lastChangedAt?: number | null) => {
    const normalized = normalizeUsername(username);
    const validation = validateUsername(normalized);
    if (!validation.valid) throw new Error(validation.error);

    if (currentUsername) {
      const cooldown = canChangeUsername(lastChangedAt);
      if (!cooldown.allowed) throw new Error(cooldown.reason);
    }

    const existing = await firestoreService.searchUserByUsername(normalized);
    if (existing) throw new Error('Username is already taken');

    const now = Date.now();
    await firestoreService.saveUser({
      uid,
      username: normalized,
      usernameChangedAt: now,
    });

    dispatch(upsertUser({
      id: uid, uid, username: normalized, usernameChangedAt: now,
    } as any));

    return normalized;
  }, [dispatch]);

  const checkUsernameCooldown = useCallback((lastChangedAt: number | null | undefined) => {
    return canChangeUsername(lastChangedAt);
  }, []);

  const getUsernameSuggestions = useCallback(async (desired: string): Promise<string[]> => {
    const base = normalizeUsername(desired);
    if (!base || base.length < 2) return [];

    const oldReserved = await firestoreService.getOldReservedUsernames();
    const existingUsernames = new Set<string>();

    if (RESERVED_USERNAMES.has(base)) {
      return suggestUsernames(base + '_user', existingUsernames, oldReserved, 5);
    }

    const exactMatch = await firestoreService.searchUserByUsername(base);
    if (exactMatch) {
      existingUsernames.add(base);
    }

    return suggestUsernames(base, existingUsernames, oldReserved, 5);
  }, []);

  const isUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    const normalized = normalizeUsername(username);
    if (RESERVED_USERNAMES.has(normalized)) return false;

    const existing = await firestoreService.searchUserByUsername(normalized);
    return !existing;
  }, []);

  const setPhone = useCallback(async (uid: string, phone: string) => {
    const e164 = normalizeToE164(phone);
    if (!e164) throw new Error('Invalid phone number');

    await firestoreService.saveUser({ uid, phoneE164: e164 });
    dispatch(upsertUser({ id: uid, uid, phoneE164: e164 } as any));
    return e164;
  }, [dispatch]);

  const regenerateShareCode = useCallback(async (uid: string, lastChangedAt?: number | null, previousRegens: number = 0) => {
    const check = canRegenerateShareCode(lastChangedAt, previousRegens);
    if (!check.allowed) throw new Error(check.reason);

    const newCode = generateShareCode();
    const now = Date.now();

    await firestoreService.saveUser({
      uid,
      shareCode: newCode,
      shareCodeChangedAt: now,
    });

    dispatch(upsertUser({
      id: uid, uid, shareCode: newCode, shareCodeChangedAt: now,
    } as any));

    return newCode;
  }, [dispatch]);

  const checkShareCodeCooldown = useCallback((lastChangedAt: number | null | undefined, previousRegens: number = 0) => {
    return canRegenerateShareCode(lastChangedAt, previousRegens);
  }, []);

  const syncContacts = useCallback(async () => {
    setSyncing(true);
    try {
      return await contactsService.syncContacts();
    } finally {
      setSyncing(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string, currentUid: string): Promise<SearchResult[]> => {
    return searchService.searchUsers(query, currentUid);
  }, []);

  const searchByUsername = useCallback(async (username: string) => {
    return searchService.searchByUsername(username);
  }, []);

  const searchByShareCode = useCallback(async (code: string) => {
    return searchService.searchByShareCode(code);
  }, []);

  const getUserProfile = useCallback(async (uid: string) => {
    return firestoreService.getUser(uid);
  }, []);

  const getUserByUsername = useCallback(async (username: string) => {
    return firestoreService.searchUserByUsername(username);
  }, []);

  const sendInvite = useCallback(async (phoneNumber: string) => {
    return inviteService.sendSMS({
      phoneNumber,
      message: inviteService.getInviteMessage(),
    });
  }, []);

  const getQRCode = useCallback(async (input: string) => {
    if (input.startsWith('NX') && input.length >= 5) {
      return qrCodeService.generateQRCodeForShareCode(input);
    }
    return qrCodeService.generateQRCode(input);
  }, []);

  const getProfileLink = useCallback((username: string) => {
    return qrCodeService.getProfileLink(username);
  }, []);

  const getShareCodeLink = useCallback((shareCode: string) => {
    return qrCodeService.getShareCodeLink(shareCode);
  }, []);

  const getUserProfileLink = useCallback((user: { username?: string | null; shareCode?: string | null }) => {
    return qrCodeService.getUserProfileLink(user);
  }, []);

  const getDeepLink = useCallback((input: string) => {
    return qrCodeService.getDeepLink(input);
  }, []);

  const getPrivacySettings = useCallback(async (uid: string) => {
    return privacyService.getPrivacySettings(uid);
  }, []);

  const updatePrivacySettings = useCallback(async (uid: string, settings: Partial<PrivacySettings>) => {
    await privacyService.updatePrivacySettings(uid, settings);
  }, []);

  return {
    syncing,
    setUsername,
    checkUsernameCooldown,
    getUsernameSuggestions,
    isUsernameAvailable,
    setPhone,
    regenerateShareCode,
    checkShareCodeCooldown,
    syncContacts,
    searchUsers,
    searchByUsername,
    searchByShareCode,
    getUserProfile,
    getUserByUsername,
    sendInvite,
    getQRCode,
    getProfileLink,
    getShareCodeLink,
    getUserProfileLink,
    getDeepLink,
    getPrivacySettings,
    updatePrivacySettings,
    formatUsername: (u: string) => `@${u}`,
    formatPhoneForDisplay,
    validateUsername,
  };
};
