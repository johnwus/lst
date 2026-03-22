import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
	import { useIsMobile } from '../hooks/use-mobile';
import mobileSplashScreen from '../asssets/mobile_splash_screen.jpg';
import desktopSplashScreen from '../asssets/desktop_splash_screen.jpg';

export default function ProtectedRoute({ children }) {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();


  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [loading, user, navigate]);

  // Show loading state while checking authentication
    if (loading) {
    const splashScreen = isMobile ? mobileSplashScreen : desktopSplashScreen;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <img 
          src={splashScreen} 
          alt="Loading" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  return children;
}
