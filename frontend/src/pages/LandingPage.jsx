import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        AI Driven Traffic Violation Detection
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        YOLOv8 + OCR powered system for automatic detection of traffic rule
        violations and e-Challan generation.
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        The backend continuously processes camera feeds, detects violations such as
        over-speeding, no helmet, and signal jumps, and stores them in MongoDB.
        This dashboard lets traffic officials manage challans and vehicle owners
        view and pay their challans securely.
      </Typography>

      <Box sx={{ mt: 6 }}>
        <Button variant="contained" size="large" onClick={handleCTA}>
          View Violations Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default LandingPage;

