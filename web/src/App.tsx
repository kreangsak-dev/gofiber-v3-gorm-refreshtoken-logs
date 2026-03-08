import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import UserManagement from "./pages/UserManagement";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

export default function App() {
  const user = useAuthStore((state) => state.user);

  // Force clean up old tokens from localStorage if they still exist from previous versions
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed?.state?.accessToken !== undefined ||
          parsed?.state?.refreshToken !== undefined
        ) {
          // Remove the tokens from the parsed state
          delete parsed.state.accessToken;
          delete parsed.state.refreshToken;
          localStorage.setItem("auth-storage", JSON.stringify(parsed));
          console.log("Cleaned up legacy tokens from localStorage");
        }
      }
    } catch (e) {
      console.error("Failed to parse or clean localStorage", e);
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/30 selection:text-primary">
        <Navbar />
        <main className="flex-1 pt-24 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Redirect logged in users away from login/register */}
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to="/dashboard" replace /> : <Register />
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Logs />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
