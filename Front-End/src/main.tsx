import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { api } from './api/client';
import './index.css';

// Fetch CSRF token for API requests
api.get('/api/csrf-token').then((r) => {
  const token = r.data?.csrfToken;
  if (token) {
    let el = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (!el) {
      el = document.createElement('meta');
      el.name = 'csrf-token';
      document.head.appendChild(el);
    }
    el.content = token;
  }
}).catch(() => {});

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
