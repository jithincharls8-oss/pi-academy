import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/inter/index.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/index.css';
import { bootstrap, type Services } from './app/bootstrap';
import { AppProvider } from './app/AppContext';
import { createRouter } from './app/router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './app/pwa';

const router = createRouter();

// Boot once per page: StrictMode runs effects twice in dev, and two bootstraps would mean two
// databases with competing autosavers writing to the same storage.
let booting: Promise<Services> | null = null;

function Root() {
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (booting ??= bootstrap()).then(setServices, (e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, []);
  if (error) {
    return (
      <div role="alert" className="m-8 rounded-lg border border-danger bg-danger-soft p-6">
        <h1 className="text-lg font-semibold text-danger">PI Academy could not start</h1>
        <p className="mt-2">{error}</p>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-fg"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }
  if (!services) {
    return (
      <div className="grid min-h-screen place-items-center" role="status">
        <div className="text-center">
          <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
          <p className="text-fg-muted">Loading PI Academy…</p>
        </div>
      </div>
    );
  }
  return (
    <AppProvider services={services}>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary scope="PI Academy">
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
registerServiceWorker();
