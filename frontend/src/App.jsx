import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignupPage from './pages/SignupPage';
import TicketsPage from './pages/TicketsPage';
import NewTicketPage from './pages/NewTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import UserListPage from './pages/UserListPage';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route element={<PrivateRoute />}>
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/users" element={<UserListPage />} />

        </Route>
      </Routes>
    </>
  );
}

export default App;