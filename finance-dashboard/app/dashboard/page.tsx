"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AccountBalanceWalletRounded,
  TrendingUpRounded,
  TrendingDownRounded,
  SavingsRounded,
  AddRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import SpendingChart from "../components/SpendingChart";
import AuthGuard from "../components/AuthGuard";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  transaction_type: "income" | "expense";
  category: string;
  transaction_date: string;
};

type TransactionForm = {
  description: string;
  amount: string;
  transaction_type: "income" | "expense";
  category: string;
  transaction_date: string;
};

const initialForm: TransactionForm = {
  description: "",
  amount: "",
  transaction_type: "expense",
  category: "Food",
  transaction_date: new Date().toLocaleDateString("en-CA"),
};

const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

function isCurrentMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("financeflow_token") || "";
  };

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      setError(
        "Please log in first. Your authentication token is not available in this browser."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load transactions.");
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the FinanceFlow API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const currentMonthTransactions = transactions.filter((transaction) =>
    isCurrentMonth(transaction.transaction_date)
  );

  const totalIncome = transactions
    .filter((transaction) => transaction.transaction_type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.transaction_type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const monthlyIncome = currentMonthTransactions
    .filter((transaction) => transaction.transaction_type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter((transaction) => transaction.transaction_type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;
  const savings = monthlyIncome - monthlyExpenses;

  const handleAddTransaction = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const token = getToken();

    if (!token) {
      setError("Please log in before adding a transaction.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add transaction.");
      }

      setTransactions((previous) => [
        data.transaction,
        ...previous,
      ]);

      setNotice("Transaction added successfully.");
      setDialogOpen(false);
      setForm({
        ...initialForm,
        transaction_date: new Date().toLocaleDateString("en-CA"),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the transaction."
      );
    } finally {
      setSaving(false);
    }
  };

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
              flexWrap: "wrap",
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "#172033" }}
              >
                Dashboard
              </Typography>

              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                Welcome back! Here&apos;s your financial overview.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => {
                setError("");
                setNotice("");
                setDialogOpen(true);
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                py: 1.3,
              }}
            >
              Add transaction
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError("")}
            >
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
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2.5,
              mb: 3,
            }}
          >
            <SummaryCard
              title="Total balance"
              amount={money(balance)}
              subtitle="All recorded income minus expenses"
              icon={<AccountBalanceWalletRounded />}
              color="#2563EB"
            />

            <SummaryCard
              title="Monthly income"
              amount={money(monthlyIncome)}
              subtitle="Income this month"
              icon={<TrendingUpRounded />}
              color="#10B981"
            />

            <SummaryCard
              title="Monthly expenses"
              amount={money(monthlyExpenses)}
              subtitle="Expenses this month"
              icon={<TrendingDownRounded />}
              color="#EF4444"
            />

            <SummaryCard
              title="Monthly savings"
              amount={money(savings)}
              subtitle="Income minus expenses this month"
              icon={<SavingsRounded />}
              color="#8B5CF6"
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
              gap: 2.5,
              alignItems: "stretch",
            }}
          >
            <SpendingChart transactions={transactions} />

            <Paper
              elevation={0}
              sx={{
                p: 3,
                minWidth: 0,
                border: "1px solid #E9EDF4",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Recent transactions
              </Typography>

              <Typography
                sx={{ color: "text.secondary", fontSize: 14, mb: 2 }}
              >
                Your latest financial activity
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : transactions.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  No transactions yet. Click &quot;Add transaction&quot; to
                  record your first one.
                </Typography>
              ) : (
                [...transactions]
                  .sort(
                    (a, b) =>
                      new Date(b.transaction_date).getTime() -
                      new Date(a.transaction_date).getTime()
                  )
                  .slice(0, 8)
                  .map((item) => {
                    const income = item.transaction_type === "income";

                   return (
                      <Box
                        key={item.id}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        py: 1.8,
        borderBottom: "1px solid #EEF1F6",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {item.description}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: "text.secondary" }}
        >
          {item.category} ·{" "}
          {new Date(item.transaction_date).toLocaleDateString("en-IN")}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontWeight: 700,
          color: income ? "#059669" : "#DC2626",
          whiteSpace: "nowrap",
        }}
      >
        {income ? "+" : "−"}
        {money(Number(item.amount))}
      </Typography>
    </Box>
                    );
                  })
              )}

              <Button
                onClick={loadTransactions}
                disabled={loading}
                sx={{ mt: 2, textTransform: "none" }}
              >
                Refresh transactions
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleAddTransaction}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Add transaction
          </DialogTitle>

          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
              fullWidth
              slotProps={{
  htmlInput: {
    maxLength: 255,
  },
}}
            />

            
<TextField
  label="Amount (₹)"
  type="number"
  value={form.amount}
  onChange={(event) =>
    setForm({ ...form, amount: event.target.value })
  }
  required
  fullWidth
  slotProps={{
    htmlInput: {
      min: 0.01,
      step: 0.01,
    },
  }}
/>


            <TextField
              label="Type"
              select
              value={form.transaction_type}
              onChange={(event) =>
                setForm({
                  ...form,
                  transaction_type: event.target.value as
                    | "income"
                    | "expense",
                })
              }
              fullWidth
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>

            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              fullWidth
            >
              {[
                "Food",
                "Transport",
                "Bills",
                "Shopping",
                "Health",
                "Education",
                "Entertainment",
                "Salary",
                "Freelance",
                "Other",
              ].map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Transaction date"
              type="date"
              value={form.transaction_date}
              onChange={(event) =>
                setForm({ ...form, transaction_date: event.target.value })
              }
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
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
              startIcon={
                saving ? <CircularProgress size={16} /> : <AddRounded />
              }
              sx={{ textTransform: "none" }}
            >
              {saving ? "Saving..." : "Save transaction"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      </Box>
    </AuthGuard>
  );
}