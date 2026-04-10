import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const publicRoutes = ['/', '/login', '/register'];

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isPublicRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}