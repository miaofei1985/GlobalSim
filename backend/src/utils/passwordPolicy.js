const COMMON_WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'qwerty123',
  'abc12345',
  '11111111',
  '00000000',
  'asdf1234',
  'iloveyou',
  'admin123',
  'welcome1',
]);

const hasSequentialPattern = (password) =>
  /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(password);

export const assessPasswordStrength = (password = '') => {
  const value = String(password);
  const normalized = value.toLowerCase();
  const length = value.length;

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const uniqueCharacters = new Set(value).size;
  const characterClassCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  let score = 0;

  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;
  if (hasLower) score += 1;
  if (hasUpper) score += 1;
  if (hasDigit) score += 1;
  if (hasSpecial) score += 1;

  if (uniqueCharacters <= Math.max(3, Math.floor(length / 3))) {
    score -= 1;
  }

  if (hasSequentialPattern(value)) {
    score -= 1;
  }

  if (COMMON_WEAK_PASSWORDS.has(normalized)) {
    score = 0;
  }

  score = Math.max(0, Math.min(score, 7));

  let level = 'weak';
  if (score >= 6) {
    level = 'strong';
  } else if (score >= 4) {
    level = 'medium';
  }

  return {
    score,
    level,
    hasLower,
    hasUpper,
    hasDigit,
    hasSpecial,
    length,
    isAcceptable:
      length >= 8 &&
      characterClassCount >= 3 &&
      !COMMON_WEAK_PASSWORDS.has(normalized) &&
      level !== 'weak',
  };
};

export default {
  assessPasswordStrength,
};
