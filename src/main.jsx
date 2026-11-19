import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Silence harmless browser extension media play/pause AbortError warnings
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.name === 'AbortError' ||
      String(event.reason.message || '').includes('play() request was interrupted'))
  ) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
