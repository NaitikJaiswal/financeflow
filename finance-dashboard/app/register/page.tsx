
"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed.");
      }

      if (!result.token) {
        throw new Error(
          "Account created, but no token was returned. Please log in."
        );
      }

      localStorage.setItem("financeflow_token", result.token);

      if (result.user) {
        localStorage.setItem(
          "financeflow_user",
          JSON.stringify(result.user)
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          border: "1px solid #E9EDF4",
          borderRadius: 4,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ color: "#2563EB", fontWeight: 800, mb: 1 }}
          >
            FinanceFlow
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Create your account
          </Typography>

          <Typography color="text.secondary">
            Start managing your personal finances.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister}>
          <TextField
            label="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
            autoComplete="name"
            margin="normal"
          />

          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            required
            autoComplete="email"
            margin="normal"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
            slotProps={{
  htmlInput: { minLength: 8 },
}}
            autoComplete="new-password"
            margin="normal"
          />

          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            fullWidth
            required
            autoComplete="new-password"
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </Box>

        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ textAlign: "center", mt: 3 }}
        >
          Already registered?{" "}
          <Box
            component="a"
            href="/login"
            sx={{ color: "#2563EB", fontWeight: 600 }}
          >
            Log in
          </Box>
        </Typography>
      </Paper>
    </Container>
  );
}

