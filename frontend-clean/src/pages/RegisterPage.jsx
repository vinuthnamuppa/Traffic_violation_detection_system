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
import api from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [roleUI, setRoleUI] = useState("USER");
  const [officialKey, setOfficialKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const backendRole = roleUI === "OFFICIAL" ? "officer" : "public";

      if (roleUI === "OFFICIAL") {
        await api.validateOfficialKey(officialKey);
      }

      const res = await api.register({
        name,
        email,
        password,
        role: backendRole,
        vehicle_number: vehicleNumber
      });

      // Persist chosen vehicle number in auth context for linking violations.
      login(res.data, { vehicleNumber });
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
            Register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a TrafficEye account to securely view or manage traffic violations and challans.
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

            <TextField
              label="Primary Vehicle Number (e.g. KA01AB1234)"
              fullWidth
              margin="normal"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              helperText="Used to link detected violations and challans to your account."
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
                {loading ? "Creating account..." : "Register"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default RegisterPage;

