import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const scopes = ['data:read', 'view:read', 'view:write'] as const;
export type Scope = (typeof scopes)[number];
export type KeyInfo = {
  id: string;
  name: string;
  prefix: string;
  scopes: Scope[];
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
};
type StoredKey = KeyInfo & { hash: string };
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const digest = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');
const publicKey = ({ hash: _hash, ...key }: StoredKey): KeyInfo =>
  structuredClone(key);
function configuration(input: Record<string, unknown>) {
  if (
    typeof input.name !== 'string' ||
    !input.name.trim() ||
    input.name.length > 80
  )
    throw new HttpError(
      400,
      'INVALID_ARGUMENT',
      'Name must contain 1–80 characters.',
    );
  if (
    !Array.isArray(input.scopes) ||
    !input.scopes.length ||
    input.scopes.length > 3 ||
    input.scopes.some((scope) => !scopes.includes(scope as Scope))
  )
    throw new HttpError(
      400,
      'INVALID_ARGUMENT',
      'Choose at least one supported permission.',
    );
  const expiresAt = input.expiresAt ?? null;
  if (
    expiresAt !== null &&
    (typeof expiresAt !== 'string' ||
      !Number.isFinite(Date.parse(expiresAt)) ||
      Date.parse(expiresAt) <= Date.now())
  )
    throw new HttpError(
      400,
      'INVALID_ARGUMENT',
      'Expiry must be a future date or null.',
    );
  return {
    name: input.name.trim(),
    scopes: [...new Set(input.scopes)] as Scope[],
    expiresAt: expiresAt as string | null,
  };
}

export class AgentKeys {
  private keys: StoredKey[] = [];
  private writes = Promise.resolve();
  constructor(private path: string) {}
  async load() {
    let raw: string;
    try {
      raw = await readFile(this.path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    const saved = JSON.parse(raw) as { version: number; keys: StoredKey[] };
    if (
      saved.version !== 1 ||
      !Array.isArray(saved.keys) ||
      saved.keys.some(
        (key) =>
          typeof key.id !== 'string' ||
          typeof key.name !== 'string' ||
          typeof key.prefix !== 'string' ||
          !/^[a-f0-9]{64}$/.test(key.hash) ||
          !Array.isArray(key.scopes) ||
          !key.scopes.length ||
          key.scopes.some((scope) => !scopes.includes(scope)) ||
          !Number.isFinite(Date.parse(key.createdAt)) ||
          [key.expiresAt, key.revokedAt, key.lastUsedAt].some(
            (date) =>
              date !== null &&
              (typeof date !== 'string' || !Number.isFinite(Date.parse(date))),
          ),
      )
    )
      throw new Error(
        'Invalid agent key store; restore it before starting the service.',
      );
    this.keys = saved.keys;
  }
  list() {
    return this.keys.map(publicKey);
  }
  private mutate<T>(change: (keys: StoredKey[]) => T): Promise<T> {
    const operation = this.writes.then(async () => {
      const next = structuredClone(this.keys);
      const result = change(next);
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.${randomUUID()}.local`;
      await writeFile(temporary, JSON.stringify({ version: 1, keys: next }), {
        mode: 0o600,
        flag: 'wx',
      });
      await rename(temporary, this.path);
      this.keys = next;
      return result;
    });
    this.writes = operation.then(
      () => {},
      () => {},
    );
    return operation;
  }
  create(input: Record<string, unknown>) {
    const config = configuration(input);
    return this.mutate((keys) => {
      if (keys.length >= 500)
        throw new HttpError(409, 'KEY_LIMIT', 'Key store limit reached.');
      const token = `shk_${randomBytes(32).toString('base64url')}`;
      const key: StoredKey = {
        ...config,
        id: randomUUID(),
        prefix: token.slice(0, 12),
        hash: digest(token),
        createdAt: new Date().toISOString(),
        expiresAt: config.expiresAt,
        revokedAt: null,
        lastUsedAt: null,
      };
      keys.push(key);
      return { key: publicKey(key), token };
    });
  }
  update(id: string, input: Record<string, unknown>) {
    const config = configuration(input);
    return this.mutate((keys) => {
      const key = keys.find((key) => key.id === id);
      if (!key) throw new HttpError(404, 'NOT_FOUND', 'Key not found.');
      if (key.revokedAt)
        throw new HttpError(
          409,
          'REVOKED',
          'Revoked keys cannot be reactivated. Create a new key.',
        );
      Object.assign(key, config);
      return publicKey(key);
    });
  }
  revoke(id: string) {
    return this.mutate((keys) => {
      const key = keys.find((key) => key.id === id);
      if (!key) throw new HttpError(404, 'NOT_FOUND', 'Key not found.');
      key.revokedAt ??= new Date().toISOString();
      return publicKey(key);
    });
  }
  authorize(token: string, scope?: Scope) {
    const hash = digest(token);
    const key = this.keys.find((key) => key.hash === hash);
    if (
      !key ||
      key.revokedAt ||
      (key.expiresAt && Date.parse(key.expiresAt) <= Date.now())
    )
      throw new HttpError(
        401,
        'INVALID_KEY',
        'API key is invalid, expired, or revoked.',
      );
    if (scope && !key.scopes.includes(scope))
      throw new HttpError(403, 'INSUFFICIENT_SCOPE', `Requires ${scope}.`);
    return publicKey(key);
  }
  used(id: string) {
    return this.mutate((keys) => {
      const key = keys.find((key) => key.id === id);
      if (key) key.lastUsedAt = new Date().toISOString();
    });
  }
}

/** Operator bootstrap credential stays on the host; API keys cannot administer keys. */
export async function loadAdminToken(path: string) {
  try {
    const token = (await readFile(path, 'utf8')).trim();
    if (!/^sha_[A-Za-z0-9_-]{43}$/.test(token))
      throw new Error('Invalid agent administrator credential file.');
    return token;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const token = `sha_${randomBytes(32).toString('base64url')}`;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, token, { mode: 0o600, flag: 'wx' });
    return token;
  }
}
