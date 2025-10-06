import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ExtensionAnalytics from "./pages/ExtensionAnalytics";
import MockTests from "./pages/MockTests";
import TakeTest from "./pages/TakeTest";
import TestResult from "./pages/TestResult";
import Flashcards from "./pages/Flashcards";
import StudyFlashcards from "./pages/StudyFlashcards";
import AIMentor from "./pages/AIMentor"; // ✅ ADD THIS
import authService from "./services/authService";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/extension-analytics"
          element={
            <ProtectedRoute>
              <ExtensionAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mock-tests"
          element={
            <ProtectedRoute>
              <MockTests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mock-test/:id"
          element={
            <ProtectedRoute>
              <TakeTest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test-result/:id"
          element={
            <ProtectedRoute>
              <TestResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <Flashcards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcard/:id"
          element={
            <ProtectedRoute>
              <StudyFlashcards />
            </ProtectedRoute>
          }
        />

        {/* ✅ AI MENTOR ROUTE - ADD THIS */}
        <Route
          path="/ai-mentor"
          element={
            <ProtectedRoute>
              <AIMentor />
            </ProtectedRoute>
          }
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
