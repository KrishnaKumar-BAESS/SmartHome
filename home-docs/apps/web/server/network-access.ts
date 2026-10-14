import { isIP } from 'node:net';

export function isTailscaleAddress(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [first, second] = address.split('.').map(Number);
  return first === 100 && second >= 64 && second <= 127;
}

export function isAllowedHousePeer(peer: string, listener: string): boolean {
  const address = peer.replace(/^::ffff:/, '');
  if (address === '127.0.0.1' || address === '::1') return true;
  if (isTailscaleAddress(listener)) return isTailscaleAddress(address);
  return isIP(address) === 4 && address.startsWith('192.168.0.');
}
