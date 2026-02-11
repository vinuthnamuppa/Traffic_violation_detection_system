import React, { useState } from "react";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import api from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      // Allow user to supply or correct their primary vehicle number on login.
      login(res.data, { vehicleNumber: vehicleNumber || undefined });
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.detail || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.96)",
            boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
            border: "1px solid rgba(148,163,184,0.25)"
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to view and manage your traffic violations and challans.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Primary Vehicle Number (optional)"
              fullWidth
              margin="normal"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              helperText="Used to fetch violations already detected for your vehicle."
            />
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                sx={{
                  textTransform: "none",
                  py: 1.2,
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, #0f172a, #14b8a6)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #020617, #0f766e)"
                  }
                }}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Don&apos;t have an account?{" "}
                <RouterLink to="/register">Register here</RouterLink>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;

