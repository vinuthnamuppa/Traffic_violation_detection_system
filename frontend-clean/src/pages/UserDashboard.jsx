import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Button,
  Paper
} from "@mui/material";
import api from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

function UserDashboard() {
  const { vehicleNumber } = useAuth();
  const [challans, setChallans] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const hasSyncedRef = useRef(false);

  const loadChallans = async () => {
    try {
      const res = await api.listChallans();
      setChallans(res.data.challans || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.detail || "Failed to load challans";
      setError(msg);
    }
  };

  const loadViolations = async () => {
    if (!vehicleNumber) {
      setViolations([]);
      return;
    }
    try {
      const res = await api.listViolations({ vehicle_number: vehicleNumber });
      setViolations(res.data.violations || []);
    } catch {
      // non-fatal; we still show challans
    }
  };

  const syncChallansFromViolations = async () => {
    if (!vehicleNumber || hasSyncedRef.current) return;
    // Avoid duplicate challans: only create for violations without an existing challan.
    const existingViolationIds = new Set(challans.map((c) => String(c.violation_id)));
    const toCreate = violations.filter((v) => !existingViolationIds.has(String(v.id)));
    if (!toCreate.length) return;
    try {
      for (const v of toCreate) {
        await api.createChallanFromViolation({ violation_id: v.id });
      }
      hasSyncedRef.current = true;
      await loadChallans();
    } catch (err) {
      // Non-fatal: user can still see violations even if challan sync fails.
      console.error("Failed to auto-create challans from violations", err);
    }
  };

  useEffect(() => {
    // Fetch latest challans and violations whenever vehicle changes.
    setLoading(true);
    (async () => {
      await Promise.all([loadChallans(), loadViolations()]);
      setLoading(false);
    })();
    hasSyncedRef.current = false;
  }, [vehicleNumber]);

  useEffect(() => {
    // Once we have violations (and possibly challans), auto-create missing challans once.
    if (!vehicleNumber || hasSyncedRef.current || violations.length === 0) return;
    syncChallansFromViolations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleNumber, violations, challans]);

  const stats = useMemo(() => {
    const total = challans.length;
    const paid = challans.filter((c) => c.status === "paid").length;
    const unpaid = total - paid;
    const totalAmount = challans.reduce((sum, c) => sum + Number(c.fine_amount || 0), 0);
    const unpaidAmount = challans
      .filter((c) => c.status !== "paid")
      .reduce((sum, c) => sum + Number(c.fine_amount || 0), 0);
    return { total, paid, unpaid, totalAmount, unpaidAmount };
  }, [challans]);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Violations &amp; Challans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all your traffic violations, fines and payment history in one place.
          </Typography>
          {vehicleNumber && (
            <Typography variant="body2" color="text.secondary">
              Linked vehicle number: <strong>{vehicleNumber}</strong>
            </Typography>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Total Challans
            </Typography>
            <Typography variant="h5">{stats.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Paid
            </Typography>
            <Typography variant="h5" color="success.main">
              {stats.paid}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
            <Typography variant="h5" color="warning.main">
              {stats.unpaid}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Pending Amount
            </Typography>
            <Typography variant="h5">₹{stats.unpaidAmount.toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>

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

      {vehicleNumber && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Detected Violations for {vehicleNumber}
          </Typography>
          {violations.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No violations detected for this vehicle in the current query window.
            </Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {violations.slice(0, 6).map((v) => {
              const imgPath = v.snapshot_path;
              const ts = v.timestamp;
              const dateTime =
                typeof ts === "string"
                  ? new Date(ts).toLocaleString()
                  : ts
                  ? new Date(ts).toLocaleString()
                  : "N/A";

              return (
                <Grid item xs={12} md={6} lg={4} key={v.id}>
                  <Card>
                    {imgPath && (
                      <CardMedia
                        component="img"
                        height="150"
                        image={imgPath.startsWith("/snapshots") ? imgPath : `/snapshots/${imgPath}`}
                        alt="Violation snapshot"
                      />
                    )}
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {v.violation_type.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Date &amp; Time: {dateTime}
                      </Typography>
                      {typeof v.speed_kmph === "number" && v.speed_kmph > 0 && (
                        <Typography variant="body2">Speed: {v.speed_kmph.toFixed(1)} km/h</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {loading && <Typography>Loading challans...</Typography>}

      {!loading && challans.length === 0 && (
        <Typography sx={{ mt: 2 }}>
          No challans found for your account yet. Drive safe and keep following the rules!
        </Typography>
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

