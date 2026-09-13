import { execFile } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';

export interface CredentialStore {
  read(): Promise<string | undefined>;
  write(value: string): Promise<void>;
}

// Use the Windows user's DPAPI key. Plaintext travels through stdin, never argv.
function protect(value: string, operation: 'Protect' | 'Unprotect') {
  if (process.platform !== 'win32')
    throw new Error('Account storage currently requires Windows DPAPI.');
  return new Promise<string>((resolve, reject) => {
    const child = execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $result=[Security.Cryptography.ProtectedData]::${operation}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result))`,
      ],
      { windowsHide: true, timeout: 15_000, maxBuffer: 256_000 },
      (error, stdout) =>
        error
          ? reject(
              new Error('Cannot access the Windows-encrypted account store.'),
            )
          : resolve(stdout.trim()),
    );
    child.stdin?.on('error', () => {});
    child.stdin?.end(value);
  });
}

export function windowsCredentialStore(path: string): CredentialStore {
  return {
    async read() {
      const encrypted = await readFile(path, 'utf8').catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return undefined;
          throw new Error('Cannot read the account store.');
        },
      );
      if (encrypted === undefined) return undefined;
      return Buffer.from(
        await protect(encrypted, 'Unprotect'),
        'base64',
      ).toString('utf8');
    },
    async write(value) {
      const encrypted = await protect(
        Buffer.from(value).toString('base64'),
        'Protect',
      );
      // Save a rotated refresh token before making it available to callers.
      await writeFile(`${path}.pending.local`, encrypted, { mode: 0o600 });
      await rename(`${path}.pending.local`, path);
    },
  };
}
