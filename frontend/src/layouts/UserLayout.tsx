import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/features/Logo';
import { useAuthStore } from '../store/authStore';

export function UserLayout() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/interviews', label: 'Entretiens', icon: 'quiz' },
    { path: '/profile', label: 'Profil', icon: 'person' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-lighter text-primary-dark font-medium'
                      : 'text-muted hover:text-primary-dark hover:bg-gray-50'
                  }`}
                >
                  <span className="material-icons text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                <span className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-dark text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-primary-dark font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-muted hover:text-primary-dark hover:bg-gray-50 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <span className="material-icons">logout</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-muted hover:text-primary-dark hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100"
            >
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-lighter text-primary-dark font-medium'
                        : 'text-muted hover:text-primary-dark hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 px-4 py-3 mt-2 border-t border-gray-100">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-dark text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm text-primary-dark font-medium">{user?.username}</span>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}