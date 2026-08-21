import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuizApp } from './components/QuizApp';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { LearningPathWrapper } from './components/LearningPathWrapper';

// Protected Route wrapper that implements the state machine logic
const ProtectedRoute: React.FC<{ children: React.ReactNode, requireAssessment?: boolean, hideIfAssessed?: boolean }> = ({ 
  children, 
  requireAssessment = false,
  hideIfAssessed = false
}) => {
  const { student, loading } = useAuth();
  
  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  if (requireAssessment && !student.assessmentCompleted) {
    return <Navigate to="/student/assessment" replace />;
  }

  if (hideIfAssessed && student.assessmentCompleted) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for public routes (e.g. login). Redirects to dashboard if already logged in.
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student, loading } = useAuth();
  
  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  if (student) {
    if (student.assessmentCompleted) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/student/assessment" replace />;
  }

  return <>{children}</>;
};

// Auto-redirect logic based on auth state
const RootRedirect: React.FC = () => {
  const { student, loading } = useAuth();
  
  if (loading) return null;
  
  if (!student) {
    return <Navigate to="/login" replace />;
  }
  
  if (!student.assessmentCompleted) {
    return <Navigate to="/student/assessment" replace />;
  }
  
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="container">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            <Route path="/student/assessment" element={
              <ProtectedRoute hideIfAssessed={true}>
                <QuizApp />
              </ProtectedRoute>
            } />

            <Route path="/student/dashboard" element={
              <ProtectedRoute requireAssessment={true}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/student/learn/*" element={
              <ProtectedRoute requireAssessment={true}>
                {/* LearningPathWrapper will handle internal routing for topics/quizzes based on URL or state, 
                    but for now we pass the mock attempt id until we wire it up fully */}
                <LearningPathWrapper />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
