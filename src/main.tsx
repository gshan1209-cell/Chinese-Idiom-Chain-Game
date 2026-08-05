import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import { App } from './app/App';
import './app/App.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('cicg:pwa-update-ready'));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('cicg:pwa-offline-ready'));
  }
});

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('找不到 React 根節點 #root。');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
