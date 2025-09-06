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
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
