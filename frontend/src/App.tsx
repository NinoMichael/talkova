import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout } from './layouts/UserLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InterviewContext = lazy(() => import('./pages/InterviewContext'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));

function LoadingFallback() {
  return <LoadingSpinner fullScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview/:id/context" element={<InterviewContext />} />
            <Route path="/interview/:id/session" element={<InterviewSession />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}