import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Login from './pages/Login';
import Setup from './pages/Setup';
import PublicConsultation from './pages/PublicConsultation';
import DashboardLayout from './pages/dashboard/Layout';
import Procedures from './pages/dashboard/Procedures';
import ProcedureDetails from './pages/dashboard/ProcedureDetails';
import ProcedureTypes from './pages/dashboard/ProcedureTypes';
import Users from './pages/dashboard/Users';
import FinancialReports from './pages/dashboard/FinancialReports';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';
import DatabaseEditor from './pages/dashboard/DatabaseEditor';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: { children: React.ReactNode, allowedRoles?: string[], requiredPermission?: string }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  // Admin has access to everything
  if (user.role === 'admin') return <>{children}</>;

  // Check if user has the required permission
  if (requiredPermission) {
    try {
      const permissions = JSON.parse(user.permissions || '[]');
      if (permissions.includes('all') || permissions.includes(requiredPermission)) {
        return <>{children}</>;
      }
    } catch (e) {}
  }

  // Fallback to role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/consulta" element={<PublicConsultation />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Procedures />} />
        <Route path="procedures/:id" element={<ProcedureDetails />} />
        <Route path="procedure-types" element={
          <ProtectedRoute allowedRoles={['admin']} requiredPermission="procedure_types">
            <ProcedureTypes />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin']} requiredPermission="users">
            <Users />
          </ProtectedRoute>
        } />
        <Route path="database" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DatabaseEditor />
          </ProtectedRoute>
        } />
        <Route path="financial-reports" element={
          <ProtectedRoute allowedRoles={['admin']} requiredPermission="finance">
            <FinancialReports />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin']} requiredPermission="reports">
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute allowedRoles={['admin']} requiredPermission="settings">
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
