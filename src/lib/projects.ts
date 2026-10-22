import { env } from 'cloudflare:workers';

export function splitTags(tags: string | undefined | null): string[] {
  return (tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export const statusClass = (status: string | undefined) =>
  ({ Live: 'live', 'In Progress': 'progress', Concept: 'concept' })[status ?? ''] ?? 'concept';

// ─── Password-protected projects ─────────────────────────────────
// The check runs on the server, so a locked project's content is never sent
// to the browser. Unlocking sets a signed cookie scoped to that project. The
// signature includes the password, so changing it in the admin locks
// everyone out again.

export const unlockCookieName = (slug: string) => `unlock_${slug.replace(/[^a-z0-9_-]/gi, '_')}`;

async function hmac(message: string): Promise<string> {
  const secret = (env as { EMDASH_ENCRYPTION_KEY?: string }).EMDASH_ENCRYPTION_KEY;
  if (!secret) throw new Error('EMDASH_ENCRYPTION_KEY is not set');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const unlockToken = (slug: string, password: string) =>
  hmac(`project-unlock:${slug}:${password}`);

// Compares two strings without leaking how many leading characters match.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([hmac(`cmp:${a}`), hmac(`cmp:${b}`)]);
  let diff = ha.length ^ hb.length;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}
