import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';

import Home from './pages/Home/Home';
import Instructions from './pages/Instructions/Instructions';
import Quiz from './pages/Quiz/Quiz';
import Result from './pages/Result/Result';
import Profile from './pages/Profile/Profile';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminLayout from './pages/AdminDashboard/AdminLayout';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Questions from './pages/Questions/Questions';
import QuestionEditor from './pages/QuestionEditor/QuestionEditor';
import Settings from './pages/Settings/Settings';
import Results from './pages/Results/Results';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="questions" element={<Questions />} />
            <Route path="questions/new" element={<QuestionEditor />} />
            <Route path="questions/:id/edit" element={<QuestionEditor />} />
            <Route path="settings" element={<Settings />} />
            <Route path="results" element={<Results />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
