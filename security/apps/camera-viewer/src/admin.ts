import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './admin.css';
import type { KeyInfo, Scope } from '../server/agent-keys';

const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const field = (id: string) => element<HTMLInputElement>(id);
const dialog = element<HTMLDialogElement>('key-dialog');
const revokeDialog = element<HTMLDialogElement>('revoke-dialog');
const names: Record<Scope, string> = {
  'data:read': 'Read inventory',
  'view:read': 'Read view',
  'view:write': 'Control view',
};
let editing: string | null = null;
let revoking: KeyInfo | null = null;
let refreshTimer: ReturnType<typeof setInterval> | undefined;
function message(text: string, error = false) {
  element('message').textContent = text;
  element('message').classList.toggle('error', error);
}
function signedIn(on: boolean) {
  element('login-panel').hidden = on;
  element('workspace').hidden = !on;
  element('logout').hidden = !on;
  if (!on) {
    field('token-value').value = '';
    element('new-secret').hidden = true;
    dialog.close();
    revokeDialog.close();
    clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
}
async function request<T>(
  path: string,
  method = 'GET',
  data?: unknown,
): Promise<T> {
  const response = await fetch(`/api/agent/admin${path}`, {
    method,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) signedIn(false);
    throw new Error(result.error?.message ?? 'Request failed.');
  }
  return result as T;
}
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never';
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text: string) {
  const item = document.createElement(tag);
  item.textContent = text;
  return item;
}
function edit(key?: KeyInfo) {
  editing = key?.id ?? null;
  element<HTMLFormElement>('key-form').reset();
  element('key-title').textContent = key ? 'Manage API key' : 'Create API key';
  element('save-key').textContent = key ? 'Save changes' : 'Create key';
  field('key-name').value = key?.name ?? '';
  for (const checkbox of document.querySelectorAll<HTMLInputElement>(
    'input[name="scope"]',
  ))
    checkbox.checked = (key?.scopes ?? ['data:read']).includes(
      checkbox.value as Scope,
    );
  if (key?.expiresAt) {
    const expiry = new Date(key.expiresAt);
    field('key-expiry').value = new Date(
      expiry.getTime() - expiry.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16);
  }
  element('form-error').textContent = '';
  dialog.showModal();
  field('key-name').focus();
}
async function refresh() {
  const result = await request<{
    keys: KeyInfo[];
    tabs: { id: string; connectedAt: string }[];
  }>('/keys');
  signedIn(true);
  if (!refreshTimer)
    refreshTimer = setInterval(() => {
      if (!document.hidden)
        void refresh().catch((error: Error) => message(error.message, true));
    }, 15_000);
  element('empty-keys').hidden = result.keys.length > 0;
  element('keys').replaceChildren(
    ...result.keys.map((key) => {
      const row = document.createElement('tr');
      const identity = document.createElement('td');
      identity.append(
        node('strong', key.name),
        node('code', `${key.prefix}…`),
        node('small', `Created ${date(key.createdAt)}`),
      );
      const permissions = document.createElement('td');
      permissions.dataset.label = 'Permissions';
      for (const scope of key.scopes) {
        const label = node('span', names[scope]);
        label.className = 'scope';
        permissions.append(label);
      }
      const usage = document.createElement('td');
      usage.dataset.label = 'Status & usage';
      const inactive =
        !!key.revokedAt ||
        (!!key.expiresAt && Date.parse(key.expiresAt) <= Date.now());
      const status = node(
        'span',
        key.revokedAt ? 'Revoked' : inactive ? 'Expired' : 'Active',
      );
      status.className = `status${inactive ? ' inactive' : ''}`;
      usage.append(
        status,
        node('small', `Expires: ${date(key.expiresAt)}`),
        node('small', `Last used: ${date(key.lastUsedAt)}`),
      );
      const actions = document.createElement('td');
      actions.dataset.label = 'Actions';
      if (!key.revokedAt) {
        const manage = node('button', 'Manage');
        manage.setAttribute('aria-label', `Manage ${key.name}`);
        manage.onclick = () => edit(key);
        const revoke = node('button', 'Revoke');
        revoke.setAttribute('aria-label', `Revoke ${key.name}`);
        revoke.onclick = () => {
          revoking = key;
          element('revoke-description').textContent =
            `Programs using “${key.name}” will lose access.`;
          revokeDialog.showModal();
        };
        actions.append(manage, revoke);
      }
      row.append(identity, permissions, usage, actions);
      return row;
    }),
  );
  element('tabs').replaceChildren(
    ...(result.tabs.length
      ? result.tabs.map((tab) => {
          const item = document.createElement('li');
          item.append(
            node('code', tab.id),
            node('small', ` · Connected ${date(tab.connectedAt)}`),
          );
          return item;
        })
      : [
          node(
            'li',
            'No atlas tabs connected. Open the atlas from the link below.',
          ),
        ]),
  );
}

element<HTMLFormElement>('login-form').onsubmit = async (event) => {
  event.preventDefault();
  const button =
    element<HTMLButtonElement>('login-form').querySelector('button')!;
  button.disabled = true;
  try {
    await request('/login', 'POST', {
      token: field('admin-token').value.trim(),
    });
    await refresh();
    message('Signed in.');
  } catch (error) {
    message((error as Error).message, true);
  } finally {
    field('admin-token').value = '';
    button.disabled = false;
  }
};
element('logout').onclick = async () => {
  try {
    await request('/logout', 'POST', {});
    signedIn(false);
    message(
      'Signed out. Connected atlas tabs no longer accept remote commands.',
    );
  } catch (error) {
    message((error as Error).message, true);
  }
};
element('new-key').onclick = () => edit();
element('cancel-key').onclick = () => dialog.close();
element('cancel-revoke').onclick = () => revokeDialog.close();
element('refresh').onclick = () => {
  void refresh().catch((error: Error) => message(error.message, true));
};
element<HTMLFormElement>('key-form').onsubmit = async (event) => {
  event.preventDefault();
  const button = element<HTMLButtonElement>('save-key');
  button.disabled = true;
  try {
    const scopes = [
      ...document.querySelectorAll<HTMLInputElement>(
        'input[name="scope"]:checked',
      ),
    ].map((input) => input.value);
    const expiry = field('key-expiry').value;
    const result = await request<{ token?: string }>(
      editing ? `/keys/${editing}` : '/keys',
      editing ? 'PATCH' : 'POST',
      {
        name: field('key-name').value,
        scopes,
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      },
    );
    dialog.close();
    if (result.token) {
      field('token-value').value = result.token;
      element('new-secret').hidden = false;
    }
    await refresh();
    message(
      editing
        ? 'Key permissions updated.'
        : 'API key created. Save the key before leaving this page.',
    );
  } catch (error) {
    element('form-error').textContent = (error as Error).message;
  } finally {
    button.disabled = false;
  }
};
element('confirm-revoke').onclick = async () => {
  if (!revoking) return;
  const button = element<HTMLButtonElement>('confirm-revoke');
  button.disabled = true;
  try {
    await request(`/keys/${revoking.id}`, 'DELETE');
    revokeDialog.close();
    field('token-value').value = '';
    element('new-secret').hidden = true;
    await refresh();
    message(`Revoked “${revoking.name}”.`);
    revoking = null;
  } catch (error) {
    message((error as Error).message, true);
  } finally {
    button.disabled = false;
  }
};
element('copy-key').onclick = async () => {
  try {
    await navigator.clipboard.writeText(field('token-value').value);
    message('Key copied.');
  } catch {
    field('token-value').select();
    message('Copy the selected key manually.');
  }
};
element('dismiss-key').onclick = () => {
  field('token-value').value = '';
  element('new-secret').hidden = true;
};
void refresh().catch((error: Error) => message(error.message, true));
