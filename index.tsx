import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Fatal: Root element not found');
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('React mounting failed:', err);
    rootElement.innerHTML = `<div style="padding: 20px; color: white; font-size: 12px;">App failed to load. Please refresh.</div>`;
  }
};

// 确保 DOM 解析完成后再启动脚本
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
