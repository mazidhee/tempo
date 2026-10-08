import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { ProductivityProvider } from './hooks/ProductivityProvider';
import FloatingTimer from './modules/focus/FloatingTimer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ProductivityProvider>
        {window.location.hash === '#/focus-widget' ? <FloatingTimer /> : <App />}
      </ProductivityProvider>
    </HashRouter>
  </React.StrictMode>,
);
