import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../state/AuthContext";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleUI, setRoleUI] = useState("USER"); // USER | OFFICIAL
  const [officialKey, setOfficialKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Map UI role to backend role
      const backendRole = roleUI === "OFFICIAL" ? "officer" : "public";

      if (roleUI === "OFFICIAL") {
        // Validate official secret key via backend helper endpoint
        await api.validateOfficialKey(officialKey);
      }

      const res = await api.register({
        name,
        email,
        password,
        role: backendRole
      });

      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.detail || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Register
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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

        <FormControl fullWidth margin="normal">
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            label="Role"
            value={roleUI}
            onChange={(e) => setRoleUI(e.target.value)}
          >
            <MenuItem value="USER">User (Vehicle Owner)</MenuItem>
            <MenuItem value="OFFICIAL">Official (Traffic Officer)</MenuItem>
          </Select>
        </FormControl>

        {roleUI === "OFFICIAL" && (
          <TextField
            label="Official Secret Key"
            fullWidth
            margin="normal"
            value={officialKey}
            onChange={(e) => setOfficialKey(e.target.value)}
            required
            helperText="Provided only to authorized traffic officials"
          />
        )}

        <Box sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" disabled={loading} fullWidth>
            {loading ? "Creating account..." : "Register"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default RegisterPage;

