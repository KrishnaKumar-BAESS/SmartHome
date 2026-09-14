import type { KeyboardEvent } from 'react';

/** Give preserved clickable panels the same keyboard activation as buttons. */
export function activateOnKey(event: KeyboardEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
}

/**
 * Keyboard handling for selectable record rows (`role="option"`): Enter and
 * Space activate, ArrowUp/ArrowDown and Home/End move focus between the
 * sibling options of the same listbox.
 */
export function optionOnKey(event: KeyboardEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return;
  const key = event.key;
  if (key === 'Enter' || key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
    return;
  }
  if (
    key !== 'ArrowDown' &&
    key !== 'ArrowUp' &&
    key !== 'Home' &&
    key !== 'End'
  )
    return;
  const list = event.currentTarget.closest('[role="listbox"]');
  if (!list) return;
  const options = Array.from(
    list.querySelectorAll<HTMLElement>('[role="option"]'),
  );
  const index = options.indexOf(event.currentTarget);
  if (index < 0) return;
  event.preventDefault();
  const next =
    key === 'Home'
      ? 0
      : key === 'End'
        ? options.length - 1
        : key === 'ArrowDown'
          ? Math.min(options.length - 1, index + 1)
          : Math.max(0, index - 1);
  options[next]?.focus();
}
