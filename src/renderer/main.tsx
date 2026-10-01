import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { ProductivityProvider } from './hooks/ProductivityProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ProductivityProvider>
        <App />
      </ProductivityProvider>
    </HashRouter>
  </React.StrictMode>,
);
