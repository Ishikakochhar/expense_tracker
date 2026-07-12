import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// ── Bootstrap theme from saved preferences (runs before first paint) ──────
try {
  const raw = localStorage.getItem('hearth-preferences');
  const prefs = raw ? JSON.parse(raw) : {};
  if (prefs.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  // Bootstrap language attribute
  const langMap: Record<string, string> = {
    'English (UK)': 'en-GB',
    'English (US)': 'en-US',
    'Hindi': 'hi',
    'Marathi': 'mr',
  };
  if (prefs.language && langMap[prefs.language]) {
    document.documentElement.lang = langMap[prefs.language];
  }
} catch {
  // silently ignore – localStorage may be unavailable
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface-container-lowest, #ffffff)',
              color: 'var(--color-on-surface, #241a0e)',
              border: '1px solid rgba(194, 200, 196, 0.4)',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
