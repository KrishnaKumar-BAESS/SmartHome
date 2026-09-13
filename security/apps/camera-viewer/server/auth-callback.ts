// Windows protocol handler: never print the callback, authorization code, or response body.
const callback = process.argv[2];
const port = Number(process.argv[3] || 4318);
try {
  if (
    !callback ||
    callback.length > 32_000 ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw new Error('Invalid callback');
  const url = new URL(callback);
  if (url.protocol !== 'xfinitydigitalhome:' || url.host !== 'auth')
    throw new Error('Invalid callback');
  const origin = `http://127.0.0.1:${port}`;
  const response = await fetch(`${origin}/api/account/callback`, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback }),
  });
  if (!response.ok) process.exitCode = 1;
} catch {
  process.exitCode = 1;
}
export {};
