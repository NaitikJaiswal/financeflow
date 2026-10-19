
"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
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
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  DeleteOutlineRounded,
  EditRounded,
  SearchRounded,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";

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

const emptyForm: TransactionForm = {
  description: "",
  amount: "",
  transaction_type: "expense",
  category: "Food",
  transaction_date: new Date().toLocaleDateString("en-CA"),
};

const formatMoney = (amount: number | string) =>
  `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) => {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString("en-IN");
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("financeflow_token");

    if (!token) {
      setError("Please log in first. No authentication token was found.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load transactions.");
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const visibleTransactions = transactions
    .filter((transaction) => {
      const matchesSearch = `${transaction.description} ${transaction.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        filter === "all" || transaction.transaction_type === filter;

      return matchesSearch && matchesType;
    })
    .sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );

  const openAddDialog = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      transaction_date: new Date().toLocaleDateString("en-CA"),
    });
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditing(transaction);

    setForm({
      description: transaction.description,
      amount: String(transaction.amount),
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      transaction_date: transaction.transaction_date.slice(0, 10),
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
      setError("Please log in before saving a transaction.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const url = editing
        ? `${API_URL}/transactions/${editing.id}`
        : `${API_URL}/transactions`;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
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
        throw new Error(data.message || "Unable to save transaction.");
      }

      if (editing) {
        setTransactions((previous) =>
          previous.map((item) =>
            item.id === editing.id ? data.transaction : item
          )
        );
        setNotice("Transaction updated successfully.");
      } else {
        setTransactions((previous) => [data.transaction, ...previous]);
        setNotice("Transaction added successfully.");
      }

      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = window.confirm(
      `Delete "${transaction.description}" (${formatMoney(transaction.amount)})? This cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("financeflow_token");

    if (!token) {
      setError("Please log in before deleting a transaction.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/transactions/${transaction.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete transaction.");
      }

      setTransactions((previous) =>
        previous.filter((item) => item.id !== transaction.id)
      );

      setNotice("Transaction deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete transaction."
      );
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
                Transactions
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 1 }}>
                Manage your income and expenses.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={openAddDialog}
              sx={{ borderRadius: 2, textTransform: "none", py: 1.3 }}
            >
              Add transaction
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

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              border: "1px solid #E9EDF4",
              borderRadius: 3,
            }}
          >
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search description or category"
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              slotProps={{
                input: {
                  startAdornment: <SearchRounded sx={{ mr: 1, color: "#64748B" }} />,
                },
              }}
            />

            <TextField
              select
              label="Transaction type"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              size="small"
              sx={{ width: { xs: "100%", sm: 200 } }}
            >
              <MenuItem value="all">All transactions</MenuItem>
              <MenuItem value="income">Income only</MenuItem>
              <MenuItem value="expense">Expenses only</MenuItem>
            </TextField>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              border: "1px solid #E9EDF4",
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                All transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {visibleTransactions.length} record(s)
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : visibleTransactions.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                {transactions.length === 0
                  ? "No transactions yet. Add your first transaction."
                  : "No transactions match your search or filter."}
              </Typography>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 650 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1.2fr 90px",
                      gap: 2,
                      px: 1,
                      py: 1.5,
                      bgcolor: "#F8FAFC",
                      borderRadius: 2,
                    }}
                  >
                    {["Description", "Category", "Date", "Amount", "Actions"].map(
                      (heading) => (
                        <Typography
                          key={heading}
                          variant="caption"
                          sx={{ fontWeight: 700, color: "#64748B" }}
                        >
                          {heading}
                        </Typography>
                      )
                    )}
                  </Box>

                  {visibleTransactions.map((transaction) => {
                    const income = transaction.transaction_type === "income";

                    return (
                      <Box
                        key={transaction.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1.2fr 90px",
                          gap: 2,
                          alignItems: "center",
                          px: 1,
                          py: 2,
                          borderBottom: "1px solid #EEF1F6",
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>
                            {transaction.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {income ? "Income" : "Expense"}
                          </Typography>
                        </Box>

                        <Typography variant="body2">
                          {transaction.category}
                        </Typography>

                        <Typography variant="body2">
                          {formatDate(transaction.transaction_date)}
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: income ? "#059669" : "#DC2626",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {income ? "+" : "−"}
                          {formatMoney(transaction.amount)}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            aria-label={`Edit ${transaction.description}`}
                            size="small"
                            onClick={() => openEditDialog(transaction)}
                          >
                            <EditRounded fontSize="small" />
                          </IconButton>

                          <IconButton
                            aria-label={`Delete ${transaction.description}`}
                            size="small"
                            color="error"
                            onClick={() => handleDelete(transaction)}
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Button
              onClick={loadTransactions}
              disabled={loading}
              sx={{ mt: 2, textTransform: "none" }}
            >
              Refresh transactions
            </Button>
          </Paper>
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
            {editing ? "Edit transaction" : "Add transaction"}
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
              slotProps={{ htmlInput: { maxLength: 255 } }}
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
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            />

            <TextField
              label="Type"
              select
              value={form.transaction_type}
              onChange={(event) =>
                setForm({
                  ...form,
                  transaction_type: event.target.value as "income" | "expense",
                })
              }
              fullWidth
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>

            <TextField
              label="Category"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

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
              sx={{ textTransform: "none" }}
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Add transaction"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      </Box>
    </AuthGuard>
  );
}
