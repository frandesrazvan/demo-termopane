import Layout from './components/Layout';
import SettingsPage from './pages/SettingsPage';
import QuotesPage from './pages/QuotesPage';
import NewQuotePage from './pages/NewQuotePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
// 1. Change import from BrowserRouter to HashRouter
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

type Page = 'settings' | 'quotes' | 'new-quote';

function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>('settings');

  const renderPage = () => {
    switch (currentPage) {
      case 'settings':
        return <SettingsPage />;
      case 'quotes':
        return <QuotesPage />;
      case 'new-quote':
        return <NewQuotePage onSave={() => setCurrentPage('quotes')} />;
      default:
        return <SettingsPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  // We don't need the base path logic for HashRouter, it works automatically
  
  return (
    // 2. Use HashRouter here. No basename prop needed.
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}