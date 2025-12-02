import Layout from './components/Layout';
import SettingsPage from './pages/SettingsPage';
import QuotesPage from './pages/QuotesPage';
import NewQuotePage from './pages/NewQuotePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  // Get base path from Vite's BASE_URL (automatically set based on vite.config.ts base option)
  const basePath = import.meta.env.BASE_URL;
  
  return (
    <BrowserRouter basename={basePath}>
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
    </BrowserRouter>
  );
}