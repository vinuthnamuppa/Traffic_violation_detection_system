import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../utils/api";

function OfficialDashboard() {
  const [filters, setFilters] = useState({
    vehicle_number: "",
    violation_type: "",
    from_date: "",
    to_date: ""
  });
  const [violations, setViolations] = useState([]);
  const [challans, setChallans] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadViolations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listViolations({
        vehicle_number: filters.vehicle_number || undefined,
        violation_type: filters.violation_type || undefined,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined
      });
      setViolations(res.data.violations || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to load violations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadChallans = async () => {
    try {
      const res = await api.listChallans();
      setChallans(res.data.challans || []);
    } catch (err) {
      // Non-fatal for the page
    }
  };

  useEffect(() => {
    loadViolations();
    loadChallans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreateChallan = async (violation) => {
    setActionError("");
    try {
      await api.createChallanFromViolation({
        violation_id: violation.id
      });
      await loadChallans();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to create challan";
      setActionError(msg);
    }
  };

  const handleUpdateChallanStatus = async (challan, status) => {
    setActionError("");
    try {
      await api.updateChallan(challan.id, { status });
      await loadChallans();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to update challan";
      setActionError(msg);
    }
  };

  const handleDeleteChallan = async (challanId) => {
    setActionError("");
    try {
      await api.deleteChallan(challanId);
      await loadChallans();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to delete challan";
      setActionError(msg);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Official Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Search and filter detected traffic violations, and manage their corresponding challans.
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Vehicle Number"
              fullWidth
              value={filters.vehicle_number}
              onChange={handleFilterChange("vehicle_number")}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Violation Type"
              placeholder="over_speeding, no_helmet, signal_jump"
              fullWidth
              value={filters.violation_type}
              onChange={handleFilterChange("violation_type")}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.from_date}
              onChange={handleFilterChange("from_date")}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.to_date}
              onChange={handleFilterChange("to_date")}
            />
          </Grid>
          <Grid item xs={12} md={2} display="flex" alignItems="center">
            <Button variant="contained" onClick={loadViolations} fullWidth disabled={loading}>
              {loading ? "Filtering..." : "Apply Filters"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Detected Violations
      </Typography>
      <Paper sx={{ mb: 4, overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date &amp; Time</TableCell>
              <TableCell>Speed (km/h)</TableCell>
              <TableCell>Snapshot</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {violations.map((v) => {
              const ts = v.timestamp;
              const dateTime =
                typeof ts === "string"
                  ? new Date(ts).toLocaleString()
                  : ts
                  ? new Date(ts).toLocaleString()
                  : "N/A";
              const snapshotUrl = v.snapshot_path;

              return (
                <TableRow key={v.id}>
                  <TableCell>{v.vehicle_number}</TableCell>
                  <TableCell>{v.violation_type}</TableCell>
                  <TableCell>{dateTime}</TableCell>
                  <TableCell>{Number(v.speed_kmph || 0).toFixed(1)}</TableCell>
                  <TableCell>
                    {snapshotUrl && (
                      <Button
                        component="a"
                        href={
                          snapshotUrl.startsWith("/snapshots")
                            ? snapshotUrl
                            : `/snapshots/${snapshotUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCreateChallan(v)}
                    >
                      Generate Challan
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {violations.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6}>No violations found for the selected filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="h6" gutterBottom>
        All Challans
      </Typography>
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Fine (₹)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challans.map((c) => {
              const createdAt =
                typeof c.created_at === "string"
                  ? new Date(c.created_at).toLocaleString()
                  : "N/A";
              return (
                <TableRow key={c.id}>
                  <TableCell>{c.vehicle_number}</TableCell>
                  <TableCell>{c.violation_type}</TableCell>
                  <TableCell>{Number(c.fine_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{createdAt}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleUpdateChallanStatus(c, "unpaid")}
                    >
                      Mark Unpaid
                    </Button>
                    <Button size="small" onClick={() => handleUpdateChallanStatus(c, "paid")}>
                      Mark Paid
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteChallan(c.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {challans.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No challans created yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default OfficialDashboard;

