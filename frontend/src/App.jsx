import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { OverlayProvider } from './context/OverlayContext';
import { ThreadProvider } from './context/ThreadContext';
import ProtectedRoute from './components/ProtectedRoute';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import LiveRoom from './pages/LiveRoom';
import TopicRoom from './pages/TopicRoom';
import ThreadRoom from './pages/ThreadRoom';
import Explore from './pages/Explore';
import Threads from './pages/Threads';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import NotFound from './pages/not-found';
import NotificationSound from './components/NotificationSound';
import PWAInstallBanner from './components/PWAInstallBanner';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useNavigationHistory } from './lib/navigation';
import { useGlobalTopic } from './hooks/useQueries';

function PushInitializer() {
  usePushNotifications();
  return null;
}

import { Toaster } from './components/ui/toaster';

// Create QueryClient outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/splash" component={Splash} />
      <Route path="/auth" component={Auth} />

      {/* Global Room: Home for global discussion */}
      <Route path="/global">
        {() => (
          <ProtectedRoute>
            <GlobalRoomWrapper />
          </ProtectedRoute>
        )}
      </Route>

      {/* Protected routes */}
      <Route path="/topic/:id">
        {(params) => (
          <ProtectedRoute>
             <TopicRoom topicId={params.id} />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/thread/:id">
        {() => (
          <ProtectedRoute>
            <ThreadRoom />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/explore">
        {() => (
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/threads">
        {() => (
          <ProtectedRoute>
            <Threads />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/notifications">
        {() => (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile/:userId?">
        {() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      </Route>
      {/* Home: LiveRoom handles mobile preview vs desktop TopicRoom */}
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <LiveRoom />
          </ProtectedRoute>
        )}
      </Route>

      {/* Catch-all 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalRoomWrapper() {
  const { data: topic, isLoading } = useGlobalTopic();
  
  if (isLoading) return <Splash />;
  if (!topic) return <NotFound />;
  
  // Use TopicRoom for the actual chat, isLiveMode=true for home-like feel (no back button on mobile)
  return <TopicRoom topicId={topic._id} isLiveMode={true} />;
}

export default function App() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  useNavigationHistory();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushInitializer />
        <NotificationSound />
        <PWAInstallBanner />
        <OverlayProvider>
          <ThreadProvider>
            <WouterRouter base={base}>
              <AppRoutes />
              <Toaster />
            </WouterRouter>
          </ThreadProvider>
        </OverlayProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
