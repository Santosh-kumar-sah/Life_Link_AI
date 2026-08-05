import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/AuthGuard";

// Lazy-loaded page components for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DonorDashboard = lazy(() => import("./pages/DonorDashboard"));
const RecipientDashboard = lazy(() => import("./pages/RecipientDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Centered loading spinner matching dark theme
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/donor"
            element={
              <AuthGuard allowedRoles={["donor"]}>
                <DonorDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/recipient"
            element={
              <AuthGuard allowedRoles={["recipient"]}>
                <RecipientDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGuard allowedRoles={["admin"]}>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
