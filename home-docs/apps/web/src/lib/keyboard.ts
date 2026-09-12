import type { KeyboardEvent } from 'react';

/** Give preserved clickable panels the same keyboard activation as buttons. */
export function activateOnKey(event: KeyboardEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
}
