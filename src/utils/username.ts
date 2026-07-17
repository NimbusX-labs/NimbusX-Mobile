const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const OLD_USERNAME_RESERVE_MS = 90 * 24 * 60 * 60 * 1000;

export const RESERVED_USERNAMES = new Set([
  'admin', 'support', 'system', 'official', 'security', 'help', 'nimbusx',
  'nimbus', 'null', 'undefined', 'true', 'false', 'root', 'api', 'staff',
  'mod', 'bot', 'anonymous', 'everyone', 'me', 'settings', 'login', 'signup',
  'register', 'logout', 'invite', 'phone', 'username', 'password', 'reset',
  'verify', 'privacy', 'terms', 'about', 'contact', 'download', 'app',
  'web', 'dev', 'test', 'delete', 'team', 'ceo', 'owner', 'admin', 'moderator',
  'support', 'security', 'info', 'mail', 'admin', 'help', 'official',
  'nimbusx', 'nimbusxapp', 'nx',
]);

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

export const validateUsername = (username: string): UsernameValidationResult => {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (normalized.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
};

export const canChangeUsername = (
  lastChangedAt: number | null | undefined
): { allowed: boolean; reason?: string } => {
  if (!lastChangedAt) {
    return { allowed: true };
  }

  const elapsed = Date.now() - lastChangedAt;
  if (elapsed < CHANGE_COOLDOWN_MS) {
    const daysLeft = Math.ceil((CHANGE_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
    return { allowed: false, reason: `You can change your username again in ${daysLeft} day(s)` };
  }

  return { allowed: true };
};

export const isOldUsernameExpired = (
  changedAt: number | null | undefined
): boolean => {
  if (!changedAt) return true;
  return Date.now() - changedAt >= OLD_USERNAME_RESERVE_MS;
};

export const normalizeUsername = (username: string): string => {
  return username.toLowerCase().trim();
};

export const formatUsername = (username: string): string => {
  return `@${username}`;
};

export const stripAtSymbol = (input: string): string => {
  return input.replace(/^@/, '').trim();
};

const SUFFIXES = ['_07', 'raj', '_4821', '_ai', '_dev', '_io', '_app', 'app', 'real', '_me', 'live'];

export const suggestUsernames = (
  desired: string,
  existingUsernames: Set<string>,
  oldReservedUsernames: Set<string>,
  maxSuggestions: number = 5
): string[] => {
  const base = normalizeUsername(desired);
  const suggestions: string[] = [];

  const combined = new Set<string>();
  existingUsernames.forEach(u => combined.add(u));
  oldReservedUsernames.forEach(u => combined.add(u));
  RESERVED_USERNAMES.forEach(u => combined.add(u));
  const forbidden = combined;

  if (!forbidden.has(base)) {
    suggestions.push(base);
  }

  for (const suffix of SUFFIXES) {
    if (suggestions.length >= maxSuggestions) break;
    const candidate = `${base}${suffix}`;
    if (!forbidden.has(candidate)) {
      suggestions.push(candidate);
    }
  }

  if (suggestions.length < maxSuggestions) {
    for (let i = 0; i < 20; i++) {
      if (suggestions.length >= maxSuggestions) break;
      const num = Math.floor(1000 + Math.random() * 9000);
      const candidate = `${base}_${num}`;
      if (!forbidden.has(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    }
  }

  return suggestions;
};
