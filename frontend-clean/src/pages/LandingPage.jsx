import React from "react";
import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import TrafficIcon from "@mui/icons-material/Traffic";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background:
          "radial-gradient(circle at top left, #2563eb 0, #020617 40%, #020617 100%)",
        color: "white",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TrafficIcon sx={{ color: "#14b8a6" }} />
              <Typography variant="h3" component="h1">
                TrafficEye
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.85)", mb: 3 }}>
              AI-powered traffic violation detection &amp; digital challan management for
              smarter, safer cities.
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                color="secondary"
                onClick={handleCTA}
              >
                View Violations Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white" }}
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
            </Box>
            <Box sx={{ mt: 4, display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h4">24/7</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Camera monitoring
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4">Real‑time</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  YOLOv8 detection
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4">Secure</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  JWT‑based access
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper
                  elevation={8}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
                    border: "1px solid rgba(148,163,184,0.4)"
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#60a5fa" }}>
                    Live camera snapshot
                  </Typography>
                  <Box
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      height: 200,
                      backgroundImage:
                        "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.25)), url('https://images.pexels.com/photos/1412235/pexels-photo-1412235.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat"
                    }}
                  />
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Detected: KA01AB1234 • No Helmet</Typography>
                    <Typography variant="body2" sx={{ color: "#bbf7d0" }}>
                      Fine: ₹1000
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(148,163,184,0.3)"
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#a5b4fc", mb: 1 }}>
                    For Officials
                  </Typography>
                  <Typography variant="body2">
                    Search, filter and generate challans for thousands of violations in seconds.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(148,163,184,0.3)"
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#f97316", mb: 1 }}>
                    For Vehicle Owners
                  </Typography>
                  <Typography variant="body2">
                    View all your violations, see evidence snapshots and pay challans securely.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default LandingPage;

