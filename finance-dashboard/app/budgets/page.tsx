
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  AccountBalanceWalletRounded,
  DeleteOutlineRounded,
  EditRounded,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";

const API_URL = "http://localhost:8000/api";

type Budget = {
  id: string;
  category: string;
  monthly_limit: number | string;
  month_start: string;
  created_at?: string;
  spent: number | string;
};

type BudgetForm = {
  category: string;
  monthly_limit: string;
  month_start: string;
};

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Rent",
  "Other",
];

const currentMonthStart = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

const money = (value: number | string) =>
  `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState<BudgetForm>({
  category: "Food",
  monthly_limit: "",
  month_start: "2026-10-01",
});

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("financeflow_token");

    if (!token) {
      setError("Please log in to view your budgets.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load budgets.");
      }

      setBudgets(data.budgets || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load budgets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const openAddDialog = () => {
    setEditing(null);
    setForm({
      category: "Food",
      monthly_limit: "",
      month_start: currentMonthStart(),
    });
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (budget: Budget) => {
    setEditing(budget);
    setForm({
      category: budget.category,
      monthly_limit: String(budget.monthly_limit),
      month_start: budget.month_start.slice(0, 10),
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const token = localStorage.getItem("financeflow_token");

    if (!token) {
      setError("Please log in before saving a budget.");
      return;
    }

    if (
      !Number.isFinite(Number(form.monthly_limit)) ||
      Number(form.monthly_limit) <= 0
    ) {
      setError("Monthly limit must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editing
          ? `${API_URL}/budgets/${editing.id}`
          : `${API_URL}/budgets`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: form.category,
            monthly_limit: Number(form.monthly_limit),
            month_start: form.month_start,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save budget.");
      }

      setNotice(
        editing ? "Budget updated successfully." : "Budget created successfully."
      );
      setDialogOpen(false);
      setEditing(null);

      // Reload so spending is recalculated by the API.
      await loadBudgets();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save budget."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    if (
      !window.confirm(
        `Delete the ${budget.category} budget of ${money(budget.monthly_limit)}?`
      )
    ) {
      return;
    }

    const token = localStorage.getItem("financeflow_token");

    if (!token) {
      setError("Please log in before deleting a budget.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/budgets/${budget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete budget.");
      }

      setBudgets((previous) =>
        previous.filter((item) => item.id !== budget.id)
      );
      setNotice("Budget deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete budget."
      );
    }
  };

  const totalLimit = budgets.reduce(
    (sum, budget) => sum + Number(budget.monthly_limit),
    0
  );

  const totalSpent = budgets.reduce(
    (sum, budget) => sum + Number(budget.spent || 0),
    0
  );

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F7F9FC" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          py: 4,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "#172033" }}
              >
                Budgets
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                Plan your monthly spending and track your limits.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={openAddDialog}
              sx={{ borderRadius: 2, textTransform: "none", py: 1.3 }}
            >
              Add budget
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {notice && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setNotice("")}
            >
              {notice}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2.5,
              mb: 3,
            }}
          >
            {[
              {
                label: "Total budget",
                value: money(totalLimit),
                color: "#2563EB",
              },
              {
                label: "Total spent",
                value: money(totalSpent),
                color: "#EF4444",
              },
              {
                label: "Remaining",
                value: money(totalLimit - totalSpent),
                color: totalLimit - totalSpent < 0 ? "#DC2626" : "#059669",
              },
            ].map((item) => (
              <Card
                key={item.label}
                elevation={0}
                sx={{
                  border: "1px solid #E9EDF4",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: item.color }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : budgets.length === 0 ? (
            <Card
              elevation={0}
              sx={{
                textAlign: "center",
                p: 5,
                border: "1px solid #E9EDF4",
                borderRadius: 3,
              }}
            >
              <AccountBalanceWalletRounded
                sx={{ fontSize: 48, color: "#2563EB", mb: 1 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                No budgets yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Create a monthly budget to start tracking your spending.
              </Typography>
              <Button variant="contained" onClick={openAddDialog}>
                Create your first budget
              </Button>
            </Card>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              {budgets.map((budget) => {
                const limit = Number(budget.monthly_limit);
                const spent = Number(budget.spent || 0);
                const percentage =
                  limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const overBudget = spent > limit;

                return (
                  <Card
                    key={budget.id}
                    elevation={0}
                    sx={{
                      border: "1px solid #E9EDF4",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                    
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 2,
    mb: 2,
  }}
>
  <Box>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {budget.category}
    </Typography>

    <Typography variant="body2" color="text.secondary">
  Month starting{" "}
  {new Date(
    `${String(budget.month_start).slice(0, 10)}T00:00:00Z`
  ).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })}
</Typography>
  </Box>

  <Box>
    <IconButton
      aria-label={`Edit ${budget.category} budget`}
      onClick={() => openEditDialog(budget)}
    >
      <EditRounded />
    </IconButton>

    <IconButton
      aria-label={`Delete ${budget.category} budget`}
      color="error"
      onClick={() => handleDelete(budget)}
    >
      <DeleteOutlineRounded />
    </IconButton>
  </Box>
</Box>

<Typography sx={{ mb: 0.5 }}>
  Spent: <strong>{money(spent)}</strong>
</Typography>

<Typography
  color="text.secondary"
  variant="body2"
  sx={{ mb: 1.5 }}
>
  Budget: {money(limit)}
</Typography>

<LinearProgress
  variant="determinate"
  value={percentage}
  sx={{
    height: 10,
    borderRadius: 5,
    bgcolor: "#E9EDF4",
    "& .MuiLinearProgress-bar": {
      borderRadius: 5,
      bgcolor: overBudget
        ? "#DC2626"
        : percentage >= 80
          ? "#F59E0B"
          : "#2563EB",
    },
  }}
/>
```

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
  Month starting{" "}
{(() => {
  const date = String(budget.month_start).slice(0, 10);
  const [year, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
})()}
</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: overBudget ? "#DC2626" : "#059669",
                          }}
                        >
                          {overBudget
                            ? `${money(spent - limit)} over budget`
                            : `${money(limit - spent)} remaining`}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          <Button
            onClick={loadBudgets}
            disabled={loading}
            sx={{ mt: 3, textTransform: "none" }}
          >
            Refresh budgets
          </Button>
        </Container>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editing ? "Edit budget" : "Add budget"}
          </DialogTitle>

          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              required
              fullWidth
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Monthly limit (₹)"
              type="number"
              value={form.monthly_limit}
              onChange={(event) =>
                setForm({ ...form, monthly_limit: event.target.value })
              }
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            />

            <TextField
  label="Month start"
  type="date"
  value={form.month_start}
  onChange={(event) =>
    setForm({ ...form, month_start: event.target.value })
  }
  required
  fullWidth
  slotProps={{ inputLabel: { shrink: true } }}
  helperText="Choose the first day of the month."
  
/>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ textTransform: "none" }}
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create budget"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      </Box>
    </AuthGuard>
  );
}
