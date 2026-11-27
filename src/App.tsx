import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
const SpeedInsights = () => null;
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SystemStatusProvider } from './context/SystemStatusContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { StudioPresenceProvider } from './context/StudioPresenceContext';
import { ToastProvider } from './components/ui/Toast';
import {
  CookieConsent,
  CookiePreferences,
  getSavedCookieConsent,
} from './components/ui/CookieConsent';
import { AppErrorBoundary } from './components/ui/AppErrorBoundary';
import { GlobalCommandPalette } from './components/ui/GlobalCommandPalette';
import { StudioPresenceOverlay } from './components/studio/StudioPresenceOverlay';
import { LoginModal } from './components/auth/LoginModal';
import {
  resolveRouteSeoPayload,
  applySeoToDocument,
} from './seo/routeMetadata';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ToolsPage } from './pages/ToolsPage';
import { StudioPage } from './pages/StudioPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AIPage } from './pages/AIPage';

// Route-level code splitting for heavy secondary and diagnostic views
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
const DocsPage = lazy(() =>
  import('./pages/DocsPage').then((m) => ({ default: m.DocsPage }))
);
const BlogPage = lazy(() =>
  import('./pages/BlogPage').then((m) => ({ default: m.BlogPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const SeoDiagnosticPage = lazy(() =>
  import('./pages/SeoDiagnosticPage').then((m) => ({
    default: m.SeoDiagnosticPage,
  }))
);
const WorkspaceDashboardPage = lazy(() =>
  import('./pages/WorkspaceDashboardPage').then((m) => ({
    default: m.WorkspaceDashboardPage,
  }))
);

const RouteMetadataSync: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    applySeoToDocument(resolveRouteSeoPayload(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const handlePopState = () => {
      applySeoToDocument(resolveRouteSeoPayload(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return null;
};

const RedirectAlias: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  return <Navigate to={{ pathname: to, search: location.search }} replace />;
};

const RouteLoadingFallback: React.FC = () => (
  <div
    className="min-h-screen bg-[#090909] text-white flex items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
      <span className="w-2 h-2 rounded-full bg-[#EB3B2D] animate-ping" />
      <span>Loading Vizra Studio...</span>
    </div>
  </div>
);

export default function App() {
  const [cookieConsent, setCookieConsent] = useState<CookiePreferences | null>(
    () => getSavedCookieConsent()
  );

  // Optional performance telemetry (SpeedInsights) is strictly gated behind explicit Analytics consent
  const allowOptionalAnalytics = Boolean(cookieConsent?.analytics);

  return (
    <ThemeProvider>
      <SystemStatusProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <StudioPresenceProvider>
              <CommandPaletteProvider>
                <RouteMetadataSync />
            <AppErrorBoundary>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                {/* Public Multi-Page Website Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/roadmap" element={<RedirectAlias to="/studio" />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPage />} />

                {/* Legal, Privacy & Cookie Policy Routes (including legacy aliases) */}
                <Route path="/terms-and-conditions" element={<LegalPage />} />
                <Route
                  path="/terms"
                  element={<RedirectAlias to="/terms-and-conditions" />}
                />
                <Route path="/privacy-policy" element={<LegalPage />} />
                <Route
                  path="/privacy"
                  element={<RedirectAlias to="/privacy-policy" />}
                />
                <Route path="/cookie-policy" element={<LegalPage />} />
                <Route
                  path="/cookies"
                  element={<RedirectAlias to="/cookie-policy" />}
                />

                {/* Core Studio Application & Diagnostic Consoles */}
                <Route path="/ai" element={<AIPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/workspace" element={<WorkspaceDashboardPage />} />
                <Route
                  path="/dashboard"
                  element={<RedirectAlias to="/workspace" />}
                />
                <Route path="/seo-diagnostics" element={<SeoDiagnosticPage />} />
                <Route
                  path="/crawler-audit"
                  element={<RedirectAlias to="/seo-diagnostics" />}
                />

                {/* Dedicated 404 Handler for Invalid Routes */}
                <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppErrorBoundary>
            <StudioPresenceOverlay />
            <GlobalCommandPalette />
            <LoginModal />
            <CookieConsent onConsentChange={setCookieConsent} />

            {/* Cookieless Vercel Web Analytics mounted independently of marketing/optional cookie consent */}
            <Analytics />

            {/* Optional Speed Insights telemetry strictly gated behind Analytics consent */}
            {allowOptionalAnalytics && <SpeedInsights />}
              </CommandPaletteProvider>
              </StudioPresenceProvider>
            </BrowserRouter>
          </ToastProvider>
      </AuthProvider>
      </SystemStatusProvider>
    </ThemeProvider>
  );
}
