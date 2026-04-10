import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout } from './layouts/UserLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ProtectedRoute, PublicOnlyRoute } from './middleware/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InterviewContext = lazy(() => import('./pages/InterviewContext'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));

function LoadingFallback() {
  return <LoadingSpinner fullScreen />;
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  if (!hydrated) {
    return <LoadingSpinner fullScreen />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthLoader>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<UserLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/interview/:id/context" element={<InterviewContext />} />
                <Route path="/interview/:id/session" element={<InterviewSession />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthLoader>
    </BrowserRouter>
  );
}