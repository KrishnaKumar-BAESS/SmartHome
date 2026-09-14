import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Only the weights the interface uses are shipped (P-01/P-07): Inter 400–600
// and Plex Mono 400–600. Decorative feed watermarks use 600, not 700.
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import { App } from './app';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');
document.getElementById('boot')?.remove();
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
