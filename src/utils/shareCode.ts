const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
const CODE_LENGTH = 9;
const REGEN_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export const generateShareCode = (): string => {
  let code = 'NX';
  for (let i = 0; i < CODE_LENGTH - 2; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
};

export const canRegenerateShareCode = (
  lastChangedAt: number | null | undefined,
  previousRegens: number
): { allowed: boolean; reason?: string } => {
  if (previousRegens === 0 && !lastChangedAt) {
    return { allowed: true };
  }

  if (!lastChangedAt) {
    return { allowed: true };
  }

  const elapsed = Date.now() - lastChangedAt;
  if (elapsed < REGEN_COOLDOWN_MS) {
    const daysLeft = Math.ceil((REGEN_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
    return { allowed: false, reason: `You can regenerate your share code in ${daysLeft} day(s)` };
  }

  return { allowed: true };
};
