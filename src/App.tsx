import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { LandingPage } from './pages/LandingPage';
import { AIPage } from './pages/AIPage';
import { ExplorePage } from './pages/ExplorePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <LoginModal />
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
  );
}
