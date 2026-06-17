import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
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
import SigPage from './pages/SigPage';
import LiasseFiscalePage from './pages/LiasseFiscalePage';
import AuditTrailPage from './pages/AuditTrailPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import NotificationsPage from './pages/NotificationsPage';
import ClientDashboard from './pages/ClientDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import ClientProjectDetail from './pages/ClientProjectDetail';
import DocumentReviewPage from './pages/DocumentReviewPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="gold-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="gold-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'OWNER') return <Navigate to="/client" replace />;
  return <>{children}</>;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="gold-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'CLIENT') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

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
        {user?.role === 'OWNER' ? (
          <>
            <Route index element={<OwnerDashboard />} />
            <Route path="owner" element={<OwnerDashboard />} />
            <Route path="owner/clients" element={<div className="page-content"><p>Liste des clients</p></div>} />
            <Route path="owner/projects" element={<div className="page-content"><p>Tous les dossiers</p></div>} />
            <Route path="owner/signatures" element={<div className="page-content"><p>Registre des signatures</p></div>} />
          </>
        ) : (
          <>
            <Route index element={<ClientDashboard />} />
            <Route path="client" element={<ClientDashboard />} />
            <Route path="client/projects/:id" element={<ClientProjectDetail />} />
          </>
        )}
        <Route path="review/:id" element={<DocumentReviewPage />} />
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
        <Route path="projects/:id/sig" element={<SigPage />} />
        <Route path="projects/:id/liasse-fiscale" element={<LiasseFiscalePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
