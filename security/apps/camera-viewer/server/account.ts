import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { CredentialStore } from './credential-store.js';

const authorizeEndpoint =
  'https://xerxes-sub.xerxessecure.com/xerxes-ctrl/oauth/authorize';
const tokenEndpoint =
  'https://xerxes-sub.xerxessecure.com/xerxes-ctrl/oauth/token';
const clientId = 'xfinity-android-application';
export const redirectUri = 'xfinitydigitalhome://auth';
const additional = {
  partner_id: 'comcast',
  rm_hint: 'true',
  mso_partner_hint: 'true',
  active_x1_account_count: 'true',
};

interface Tokens {
  access: string;
  refresh: string;
  id?: string;
  expires: number;
}

export class Account {
  private tokens?: Tokens;
  private pending?: { state: string; verifier: string; expires: number };
  private exchange?: Promise<Tokens>;
  private needsLogin = false;
  private retryAt = 0;
  private persistenceFailed = false;
  private loginError?: string;
  constructor(
    private readonly secret: string,
    private readonly store: CredentialStore,
    private readonly request: typeof fetch = fetch,
    private readonly now = Date.now,
  ) {}

  async load() {
    const raw = await this.store.read();
    if (!raw) return;
    const value = JSON.parse(raw) as Tokens;
    if (
      typeof value.access !== 'string' ||
      typeof value.refresh !== 'string' ||
      !Number.isFinite(value.expires) ||
      (value.id !== undefined && typeof value.id !== 'string')
    )
      throw new Error('Invalid account store. Sign in again.');
    this.tokens = value;
  }

  status() {
    return {
      configured: !!this.secret,
      signedIn: !!this.tokens && !this.needsLogin,
      needsLogin: this.needsLogin,
      persistenceFailed: this.persistenceFailed,
      loginError:
        this.loginError ||
        (this.pending && this.pending.expires <= this.now()
          ? 'Sign-in expired. Start sign-in again.'
          : undefined),
    };
  }

  begin() {
    if (!this.secret)
      throw new Error('Configure the account client credential first.');
    if (this.exchange)
      throw new Error('An account request is already running.');
    const verifier = randomBytes(32).toString('base64url');
    this.loginError = undefined;
    const state = randomBytes(32).toString('base64url');
    this.pending = { state, verifier, expires: this.now() + 10 * 60_000 };
    const url = new URL(authorizeEndpoint);
    url.search = new URLSearchParams({
      ...additional,
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile',
      state,
      code_challenge_method: 'S256',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      activity_id: randomUUID(),
    }).toString();
    return url.href;
  }

  async complete(callback: string) {
    if (callback.length > 32_000) throw new Error('Invalid sign-in callback.');
    const url = new URL(callback);
    const pending = this.pending;
    if (
      url.protocol !== 'xfinitydigitalhome:' ||
      url.host !== 'auth' ||
      url.pathname ||
      url.username ||
      url.password ||
      url.hash ||
      !pending ||
      pending.expires <= this.now() ||
      url.searchParams.getAll('state').length !== 1 ||
      url.searchParams.get('state') !== pending.state
    )
      throw new Error(
        'Sign-in callback is invalid or expired. Start sign-in again.',
      );
    if (this.exchange)
      throw new Error('An account request is already running.');
    this.pending = undefined;
    const code = url.searchParams.get('code');
    if (
      !code ||
      url.searchParams.getAll('code').length !== 1 ||
      url.searchParams.has('error')
    ) {
      this.loginError =
        'Xfinity sign-in was not completed. Start sign-in again.';
      throw new Error('Xfinity sign-in was not completed.');
    }
    this.exchange = this.tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: pending.verifier,
    });
    try {
      await this.exchange;
      this.retryAt = 0;
    } catch (error) {
      this.loginError = 'Sign-in could not be completed. Start sign-in again.';
      throw error;
    } finally {
      this.exchange = undefined;
    }
  }

  private async tokenRequest(
    fields: Record<string, string>,
    previous?: Tokens,
  ): Promise<Tokens> {
    let response: Response;
    try {
      response = await this.request(tokenEndpoint, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          ...additional,
          client_id: clientId,
          client_secret: this.secret,
          scope: 'profile',
          activity_id: randomUUID(),
          ...fields,
        }),
      });
    } catch {
      throw new Error('Xfinity account service is unavailable. Retry shortly.');
    }
    const value = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (value.error === 'invalid_grant' && previous) this.needsLogin = true;
      throw new Error(
        this.needsLogin
          ? 'Xfinity requires a new sign-in.'
          : `Xfinity account request failed (${response.status}).`,
      );
    }
    if (
      typeof value.access_token !== 'string' ||
      typeof (value.refresh_token || previous?.refresh) !== 'string' ||
      !Number.isFinite(Number(value.expires_in)) ||
      Number(value.expires_in) <= 0
    )
      throw new Error('Xfinity did not return renewable account credentials.');
    const next: Tokens = {
      access: value.access_token,
      refresh: value.refresh_token || previous!.refresh,
      id: typeof value.id_token === 'string' ? value.id_token : previous?.id,
      expires: this.now() + Number(value.expires_in) * 1000,
    };
    // Retain a rotated credential in memory if storage fails; retry saving rather than reuse its predecessor.
    this.tokens = next;
    this.needsLogin = false;
    this.persistenceFailed = true;
    await this.store.write(JSON.stringify(next));
    this.persistenceFailed = false;
    return next;
  }

  async credentials(
    rejectedAccess?: string,
  ): Promise<{ access: string; id?: string }> {
    if (this.exchange) return this.exchange;
    this.exchange = this.availableCredentials(rejectedAccess);
    try {
      return await this.exchange;
    } finally {
      this.exchange = undefined;
    }
  }

  private async availableCredentials(rejectedAccess?: string): Promise<Tokens> {
    if (!this.tokens || this.needsLogin)
      throw new Error('Sign in to Xfinity to load cameras.');
    if (this.persistenceFailed) {
      await this.store.write(JSON.stringify(this.tokens));
      this.persistenceFailed = false;
    }
    if (
      this.tokens.expires > this.now() + 60_000 &&
      this.tokens.access !== rejectedAccess
    )
      return this.tokens;
    if (this.now() < this.retryAt)
      throw new Error('Xfinity account renewal will retry shortly.');
    try {
      return await this.tokenRequest(
        { grant_type: 'refresh_token', refresh_token: this.tokens.refresh },
        this.tokens,
      );
    } catch (error) {
      this.retryAt = this.now() + 30_000;
      throw error;
    }
  }
}
