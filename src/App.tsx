import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import {
  CookieConsent,
  CookiePreferences,
  getSavedCookieConsent,
} from './components/ui/CookieConsent';
import { LoginModal } from './components/auth/LoginModal';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ToolsPage } from './pages/ToolsPage';
import { StudioPage } from './pages/StudioPage';
import { ExplorePage } from './pages/ExplorePage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DocsPage } from './pages/DocsPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AIPage } from './pages/AIPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SeoDiagnosticPage } from './pages/SeoDiagnosticPage';
import { WorkspaceDashboardPage } from './pages/WorkspaceDashboardPage';

export default function App() {
  const [cookieConsent, setCookieConsent] = useState<CookiePreferences | null>(
    () => getSavedCookieConsent()
  );

  const allowAnalytics = cookieConsent ? cookieConsent.analytics : false;

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Multi-Page Website Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/roadmap" element={<StudioPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/terms" element={<LegalPage />} />

            {/* Core Studio Application & Diagnostic Consoles */}
            <Route path="/ai" element={<AIPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/workspace" element={<WorkspaceDashboardPage />} />
            <Route path="/dashboard" element={<WorkspaceDashboardPage />} />
            <Route path="/seo-diagnostics" element={<SeoDiagnosticPage />} />
            <Route path="/crawler-audit" element={<SeoDiagnosticPage />} />

            {/* Dedicated 404 Handler for Invalid Routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <LoginModal />
          <CookieConsent onConsentChange={setCookieConsent} />
          {allowAnalytics && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
