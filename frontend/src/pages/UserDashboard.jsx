import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Typography,
  Button
} from "@mui/material";
import api from "../utils/api";

function UserDashboard() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadChallans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listChallans();
      setChallans(res.data.challans || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.detail || "Failed to load challans";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallans();
  }, []);

  const handlePay = async (challanId) => {
    setActionError("");
    try {
      await api.payChallan(challanId);
      await loadChallans();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to process payment";
      setActionError(msg);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Violations &amp; Challans
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        These entries are linked to your account via challans created by traffic officials.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      {loading && <Typography>Loading challans...</Typography>}

      {!loading && challans.length === 0 && (
        <Typography sx={{ mt: 2 }}>No challans found for your account.</Typography>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {challans.map((c) => {
          const statusColor = c.status === "paid" ? "success" : "warning";
          const imgPath = c.meta?.snapshot_path;
          const ts = c.meta?.timestamp;
          const dateTime =
            typeof ts === "string"
              ? new Date(ts).toLocaleString()
              : ts
              ? new Date(ts).toLocaleString()
              : "N/A";

          return (
            <Grid item xs={12} md={6} lg={4} key={c.id}>
              <Card>
                {imgPath && (
                  <CardMedia
                    component="img"
                    height="160"
                    image={imgPath.startsWith("/snapshots") ? imgPath : `/snapshots/${imgPath}`}
                    alt="Violation snapshot"
                  />
                )}
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                      {c.vehicle_number || "Vehicle"} - {c.violation_type}
                    </Typography>
                    <Chip label={c.status.toUpperCase()} color={statusColor} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Challan ID: {c.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Date &amp; Time: {dateTime}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
                    Fine Amount: ₹{Number(c.fine_amount || 0).toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={c.status === "paid"}
                    onClick={() => handlePay(c.id)}
                  >
                    {c.status === "paid" ? "Paid" : "Pay Challan"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export default UserDashboard;

