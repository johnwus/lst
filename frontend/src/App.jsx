import { Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import GlobalChatScreen from "./screens/GlobalChatScreen";
import ExploreScreen from "./screens/ExploreScreen";
import HomeScreen from "./screens/HomeScreen";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function TokenCheck() {
  const token = localStorage.getItem("token");
  return <Navigate to={token ? "/home" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/token-check" element={<TokenCheck />} />
      <Route
        path="/login"
        element={<LoginScreen />}
      />
      <Route
        path="/register"
        element={<RegisterScreen />}
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <GlobalChatScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExploreScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
