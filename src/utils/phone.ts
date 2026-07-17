const COUNTRY_CODE = '91';

export const normalizeToE164 = (raw: string): string | null => {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.length === 0) return null;

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 0) return null;

  if (digits.length >= 11 && digits.startsWith(COUNTRY_CODE)) {
    return `+${digits}`;
  }

  const withCountry = `${COUNTRY_CODE}${digits.replace(/^0+/, '')}`;
  if (withCountry.length >= 7 && withCountry.length <= 15) return `+${withCountry}`;
  return null;
};

export const formatPhoneForDisplay = (e164: string): string => {
  const match = e164.match(/^\+(\d{1,3})(\d{4,})$/);
  if (!match) return e164;
  const cc = match[1];
  const national = match[2];
  if (national.length === 10) {
    return `${cc} ${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return `+${cc} ${national}`;
};

export const hashPhoneNumber = async (e164: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(e164);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const hashPhoneNumbers = async (numbers: string[]): Promise<string[]> => {
  const encoder = new TextEncoder();
  return Promise.all(
    numbers.map(async (num) => {
      const data = encoder.encode(num);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    })
  );
};

export const validatePhone = (phone: string): boolean => {
  return normalizeToE164(phone) !== null;
};
