import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import JobIndex from './pages/public/JobIndex';
import AdminDashboard from './pages/admin/AdminDashboard';
import CandidateTracker from './pages/admin/CandidateTracker';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<JobIndex />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/placements/:id/tracker" element={<CandidateTracker />} />
            </Route>

            {/* Candidate Routes */}
            <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
              <Route path="/candidate" element={<CandidateDashboard />} />
            </Route>

            {/* Interviewer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['interviewer', 'admin']} />}>
              <Route path="/interviewer" element={<InterviewerDashboard />} />
            </Route>
            
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
