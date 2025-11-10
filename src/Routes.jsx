import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import HomeDashboard from './pages/home-dashboard';
import PhotoDiagnosis from './pages/photo-diagnosis';
import CommunityAlerts from './pages/community-alerts';
import DiagnosisResults from './pages/diagnosis-results';
import FarmingCalendar from './pages/farming-calendar';
import DiagnosisHistory from './pages/diagnosis-history'; // <-- LANGKAH 1: IMPORT HALAMAN BARU
import LoginPage from './pages/login'; // <-- TAMBAHKAN BARIS INI
import RegisterPage from './pages/register'; // <-- TAMBAHKAN BARIS INI
import ForgotPasswordPage from './pages/forgot-password'; // <-- Tambahkan ini
import ResetPasswordPage from './pages/reset-password'; // <-- TAMBAHKAN INI


const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/home-dashboard" element={<HomeDashboard />} />
        <Route path="/photo-diagnosis" element={<PhotoDiagnosis />} />
        <Route path="/community-alerts" element={<CommunityAlerts />} />
        <Route path="/diagnosis-results" element={<DiagnosisResults />} />
        <Route path="/farming-calendar" element={<FarmingCalendar />} />
        
        {/* LANGKAH 2: TAMBAHKAN RUTE BARU DI SINI */}
        <Route path="/diagnosis-history" element={<DiagnosisHistory />} />

        <Route path="/login" element={<LoginPage />} /> {/* <-- TAMBAHKAN BARIS INI */}
        <Route path="/register" element={<RegisterPage />} /> {/* <-- TAMBAHKAN BARIS INI */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* <-- Tambahkan ini */}
              <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* <-- TAMBAHKAN INI */}


        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;