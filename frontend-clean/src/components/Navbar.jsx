import React from "react";
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        background:
          "linear-gradient(to right, rgba(15,23,42,0.92), rgba(15,23,42,0.9))",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(148,163,184,0.35)"
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1
          }}
        >
          <IconButton
            size="small"
            sx={{
              mr: 1,
              color: "#14b8a6",
              backgroundColor: "rgba(15,23,42,0.8)",
              borderRadius: "12px"
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
              TrafficEye
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, fontSize: 11, letterSpacing: 0.4 }}
            >
              Traffic Violation Intelligence
            </Typography>
          </Box>
        </Box>

        {!isAuthenticated && (
          <Box display="flex" gap={1}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              sx={{
                borderRadius: 999,
                px: 2.5,
                py: 0.8,
                border: "1px solid rgba(148,163,184,0.6)",
                textTransform: "none",
                fontWeight: 500
              }}
              variant="outlined"
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              sx={{
                borderRadius: 999,
                px: 2.8,
                py: 0.8,
                textTransform: "none",
                fontWeight: 500,
                background:
                  "linear-gradient(135deg, #14b8a6, #22c55e)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #0f766e, #16a34a)"
                }
              }}
              variant="contained"
            >
              Register
            </Button>
          </Box>
        )}

        {isAuthenticated && (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user?.email} ({role === "officer" ? "OFFICIAL" : "USER"})
            </Typography>
            <Button
              color="inherit"
              component={RouterLink}
              to="/dashboard"
              sx={{
                borderRadius: 999,
                px: 2.2,
                py: 0.7,
                textTransform: "none",
                border: "1px solid rgba(148,163,184,0.6)"
              }}
              variant="outlined"
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{
                borderRadius: 999,
                px: 2.2,
                py: 0.7,
                textTransform: "none",
                bgcolor: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.7)",
                "&:hover": {
                  bgcolor: "rgba(239,68,68,0.25)"
                }
              }}
              variant="outlined"
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

