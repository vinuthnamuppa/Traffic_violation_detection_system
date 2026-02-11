import React from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline, Box } from "@mui/material";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import OfficialDashboard from "./pages/OfficialDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./state/AuthContext.jsx";

function DashboardSwitcher() {
  const { role } = useAuth();
  if (role === "officer") {
    return (
      <ProtectedRoute allowedRoles={["officer"]}>
        <OfficialDashboard />
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute allowedRoles={["public", "officer"]}>
      <UserDashboard />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <Box component="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </>
  );
}

export default App;
