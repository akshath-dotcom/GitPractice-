import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');

try {
  createRoot(rootEl!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  rootEl!.innerHTML = `<pre style="padding:24px;color:#fff;background:#7f1d1d;white-space:pre-wrap">${String(err)}</pre>`;
}
