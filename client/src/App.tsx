import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import TransactionsPage from './pages/TransactionsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import BilanPage from './pages/BilanPage';
import CpcPage from './pages/CpcPage';
import JournalPage from './pages/JournalPage';
import GrandLivrePage from './pages/GrandLivrePage';
import BalancePage from './pages/BalancePage';
import TvaPage from './pages/TvaPage';
import AuditReportPage from './pages/AuditReportPage';
import SynthesePage from './pages/SynthesePage';
import CahierTravailPage from './pages/CahierTravailPage';
import ExportFiscalPage from './pages/ExportFiscalPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="gold-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:id/documents" element={<DocumentsPage />} />
        <Route path="projects/:id/transactions" element={<TransactionsPage />} />
        <Route path="projects/:id/anomalies" element={<AnomaliesPage />} />
        <Route path="projects/:id/bilan" element={<BilanPage />} />
        <Route path="projects/:id/cpc" element={<CpcPage />} />
        <Route path="projects/:id/journal" element={<JournalPage />} />
        <Route path="projects/:id/grand-livre" element={<GrandLivrePage />} />
        <Route path="projects/:id/balance" element={<BalancePage />} />
        <Route path="projects/:id/tva" element={<TvaPage />} />
        <Route path="projects/:id/audit-report" element={<AuditReportPage />} />
        <Route path="projects/:id/synthese" element={<SynthesePage />} />
        <Route path="projects/:id/cahier-travail" element={<CahierTravailPage />} />
        <Route path="projects/:id/export" element={<ExportFiscalPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
