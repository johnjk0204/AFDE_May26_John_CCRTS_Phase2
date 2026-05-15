import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ComplaintRegistration from './pages/ComplaintRegistration';
import ComplaintList from './pages/ComplaintList';
import ComplaintDetail from './pages/ComplaintDetail';
import AgentWorkQueue from './pages/AgentWorkQueue';
import EscalationDashboard from './pages/EscalationDashboard';
import ReportsDashboard from './pages/ReportsDashboard';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role_name)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="complaints" element={<ComplaintList />} />
        <Route path="complaints/new" element={<ComplaintRegistration />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="my-complaints" element={<ComplaintList myOnly />} />
        <Route path="work-queue" element={<PrivateRoute roles={['Support Agent', 'Admin', 'Supervisor']}><AgentWorkQueue /></PrivateRoute>} />
        <Route path="escalations" element={<PrivateRoute roles={['Admin', 'Supervisor']}><EscalationDashboard /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute roles={['Admin', 'Supervisor', 'Quality Team']}><ReportsDashboard /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute roles={['Admin']}><UserManagement /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute roles={['Admin']}><CategoryManagement /></PrivateRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1f2937', color: '#fff', borderRadius: '10px' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
