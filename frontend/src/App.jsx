import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignupPage from './pages/SignupPage';
import TicketsPage from './pages/TicketsPage';
import NewTicketPage from './pages/NewTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import UserListPage from './pages/UserListPage';
import CategoryListPage from './pages/CategoryListPage';
import DashboardPage from './pages/DashboardPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import AgentDashboardPage from './pages/AgentDashboardPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Header />
      <Toaster position="top-center" />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/" element={<Navigate to="/tickets" replace />} />

        <Route element={<PrivateRoute />}>
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/categories" element={<CategoryListPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </>
  );
}

export default App;