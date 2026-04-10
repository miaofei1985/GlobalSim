import { createHash, randomBytes } from 'crypto';
import redisClient from '../config/redis.js';

const CAPTCHA_TTL_SECONDS = 5 * 60;
const CAPTCHA_LENGTH = 5;
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizeAnswer = (value = '') =>
  String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const buildCaptchaKey = (captchaId) => `auth:captcha:${captchaId}`;

const digestAnswer = (answer) =>
  createHash('sha256')
    .update(
      `${process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'globalsim-captcha'}:${normalizeAnswer(answer)}`
    )
    .digest('hex');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateCaptchaCode = () =>
  Array.from({ length: CAPTCHA_LENGTH }, () =>
    CAPTCHA_CHARS[randomInt(0, CAPTCHA_CHARS.length - 1)]
  ).join('');

const generateCaptchaId = () => randomBytes(16).toString('hex');

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const createNoiseLines = () =>
  Array.from({ length: 6 }, (_, index) => {
    const x1 = randomInt(0, 160);
    const y1 = randomInt(8, 52);
    const x2 = randomInt(0, 160);
    const y2 = randomInt(8, 52);
    const opacity = 0.18 + index * 0.05;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(129,140,248,${opacity.toFixed(2)})" stroke-width="${randomInt(1, 2)}" />`;
  }).join('');

const createNoiseDots = () =>
  Array.from({ length: 18 }, () => {
    const cx = randomInt(6, 154);
    const cy = randomInt(8, 52);
    const radius = randomInt(1, 2);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(255,255,255,0.18)" />`;
  }).join('');

const createCaptchaSvg = (code) => {
  const letters = code
    .split('')
    .map((char, index) => {
      const x = 18 + index * 26 + randomInt(-2, 2);
      const y = 34 + randomInt(-5, 5);
      const rotate = randomInt(-18, 18);
      return `<text x="${x}" y="${y}" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#eef2ff" transform="rotate(${rotate} ${x} ${y})">${escapeXml(char)}</text>`;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60" role="img" aria-label="captcha">
      <defs>
        <linearGradient id="captchaBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#312e81" />
        </linearGradient>
      </defs>
      <rect width="160" height="60" rx="12" fill="url(#captchaBg)" />
      ${createNoiseLines()}
      ${createNoiseDots()}
      ${letters}
    </svg>
  `.trim();
};

export const createCaptchaChallenge = async () => {
  const code = generateCaptchaCode();
  const captchaId = generateCaptchaId();
  const key = buildCaptchaKey(captchaId);

  await redisClient.setEx(
    key,
    CAPTCHA_TTL_SECONDS,
    JSON.stringify({
      digest: digestAnswer(code),
      createdAt: new Date().toISOString(),
    })
  );

  return {
    captchaId,
    svg: createCaptchaSvg(code),
    expiresInSeconds: CAPTCHA_TTL_SECONDS,
  };
};

export const verifyCaptchaChallenge = async (captchaId, answer) => {
  const normalizedCaptchaId = String(captchaId || '').trim();
  const normalizedAnswer = normalizeAnswer(answer);

  if (!normalizedCaptchaId || !normalizedAnswer) {
    throw new Error('Human verification failed. Please try again.');
  }

  const key = buildCaptchaKey(normalizedCaptchaId);
  const raw = await redisClient.get(key);

  if (!raw) {
    throw new Error('Human verification failed. Please try again.');
  }

  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    await redisClient.del(key);
    throw new Error('Human verification failed. Please try again.');
  }

  const isValid = payload?.digest === digestAnswer(normalizedAnswer);
  await redisClient.del(key);

  if (!isValid) {
    throw new Error('Human verification failed. Please try again.');
  }

  return true;
};

export default {
  createCaptchaChallenge,
  verifyCaptchaChallenge,
};
