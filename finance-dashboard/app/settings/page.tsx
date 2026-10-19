
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("financeflow_user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setName(user.name || user.full_name || "");
        setEmail(user.email || "");
      } catch {
        // Ignore invalid locally stored user data.
      }
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("financeflow_token");
    localStorage.removeItem("financeflow_user");
    router.replace("/login");
  }

  function handleSave() {
    setError("");
    setMessage(
      "Your profile details are displayed locally. Profile editing is not connected to the backend yet."
    );
  }

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
        <Sidebar />

        <Container maxWidth="md" sx={{ py: 5 }}>
          <Typography variant="h4" fontWeight={700} color="#172554" mb={1}>
            Settings
          </Typography>

          <Typography color="text.secondary" mb={4}>
            Manage your FinanceFlow account and preferences.
          </Typography>

          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Profile
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {message && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            <TextField
              label="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Email address"
              value={email}
              fullWidth
              margin="normal"
              slotProps={{ input: { readOnly: true } }}
            />

            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ mt: 2, textTransform: "none" }}
            >
              Save preferences
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              Account
            </Typography>

            <Typography color="text.secondary" mb={2}>
              Sign out of your FinanceFlow account on this browser.
            </Typography>

            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ textTransform: "none" }}
            >
              Log out
            </Button>
          </Paper>
        </Container>
      </Box>
    </AuthGuard>
  );
}
