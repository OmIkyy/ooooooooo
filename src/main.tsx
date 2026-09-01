import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against sandbox WebSocket / HMR rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e?.reason?.message || String(e?.reason || '');
    if (reason.includes('WebSocket') || reason.includes('vite') || reason.includes('ws://') || reason.includes('wss://')) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

