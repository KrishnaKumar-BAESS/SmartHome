import { useEffect, useState } from 'react';

function format(now: Date) {
  return (
    now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) +
    '  ' +
    now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  );
}

/**
 * The demonstration feed's ticking clock owns its own interval so the rest
 * of the application never re-renders once a second.
 */
export function FeedClock() {
  const [text, setText] = useState(() => format(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setText(format(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span aria-hidden="true">{text}</span>;
}
