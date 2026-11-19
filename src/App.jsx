import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { KfcProvider, useKfc } from './context/KfcContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import StoresPage from './pages/StoresPage';
import FranchiseesPage from './pages/FranchiseesPage';
import ProductsPage from './pages/ProductsPage';
import AuditsPage from './pages/AuditsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import RequestsPage from './pages/RequestsPage';
import FeedbackPage from './pages/FeedbackPage';
import AppealsPage from './pages/AppealsPage';
import CertificatesPage from './pages/CertificatesPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children }) {
  const { currentUser } = useKfc();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <KfcProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)'
            }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="franchisees" element={<FranchiseesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="audits" element={<AuditsPage />} />
            <Route path="audits/recommend-pass" element={<AuditsPage fixedCategory="Recommend For Pass" />} />
            <Route path="audits/review" element={<AuditsPage fixedCategory="Review List" />} />
            <Route path="audits/passed" element={<AuditsPage fixedCategory="Passed" />} />
            <Route path="audits/other-fail" element={<AuditsPage fixedCategory="Other Fail" />} />
            <Route path="audits/critical-fail" element={<AuditsPage fixedCategory="L3 Critical Fail" />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="appeals" element={<AppealsPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </KfcProvider>
  );
}

