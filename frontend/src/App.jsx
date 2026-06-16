import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/Login';
import SignupPage from './pages/SignupPage';
import TicketsPage from './pages/TicketsPage';
import NewTicketPage from './pages/NewTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ProfilePage from './pages/ProfilePage';
import AgentDashboardPage from './pages/AgentDashboardPage';
import DashboardPage from './pages/DashboardPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import UserListPage from './pages/UserListPage';
import CategoryListPage from './pages/CategoryListPage';
import KnowledgePage from './pages/KnowledgePage';
import KnowledgeListPage from './pages/KnowledgeListPage';
import AgentsPerformancePage from './pages/AgentsPerformancePage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Toaster position="top-center" />

      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main-content">
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/tickets" replace />} />

            {/* Private routes for logged-in users */}
            <Route element={<PrivateRoute />}>
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<NewTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/agents-performance" element={<AgentsPerformancePage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/categories" element={<CategoryListPage />} />
              <Route path="/admin/knowledge" element={<KnowledgeListPage />} />
              
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/tickets" replace />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;