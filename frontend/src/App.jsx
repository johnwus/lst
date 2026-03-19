import { Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import GlobalChatScreen from "./screens/GlobalChatScreen";
import { NotificationFeed } from "./screens/Notificationfeed";
import Profile from "./screens/Profile";
import Settings from "./screens/Settings";
import MiniThreadScreen from "./screens/MiniThreadScreen";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function TokenCheck() {
  const token = localStorage.getItem("token");
  return <Navigate to={token ? "/chat" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/token-check" element={<TokenCheck />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <GlobalChatScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationFeed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/threads/:id"
        element={
          <ProtectedRoute>
            <MiniThreadScreen />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}