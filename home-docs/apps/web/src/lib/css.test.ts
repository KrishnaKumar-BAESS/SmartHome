import { expect, it } from 'vitest';
import { css } from './css';

it('preserves vendor prefixes, custom properties, gradients and font declarations', () => {
  expect(
    css(
      'font:500 12px IBM Plex Sans;--accent:#abc;-webkit-backdrop-filter:blur(8px);background:linear-gradient(0deg,red,blue);',
    ),
  ).toEqual({
    font: '500 12px IBM Plex Sans',
    '--accent': '#abc',
    WebkitBackdropFilter: 'blur(8px)',
    background: 'linear-gradient(0deg,red,blue)',
  });
});
