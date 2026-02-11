import React, { useState } from "react";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../state/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      login(res.data);
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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Login
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
        <Box sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" disabled={loading} fullWidth>
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
    </Container>
  );
}

export default LoginPage;

