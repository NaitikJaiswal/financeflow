
"use client";

import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F5F8FF",
        px: 2,
        py: 5,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 6 },
            borderRadius: 4,
            textAlign: "center",
            border: "1px solid #E5EAF3",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              mb: 3,
              borderRadius: 3,
              bgcolor: "#E8F0FF",
              color: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            ₹
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#2563EB",
              mb: 2,
              fontSize: { xs: 34, sm: 44 },
            }}
          >
            FinanceFlow
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Take control of your money.
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.8 }}
          >
            Track income and expenses, manage monthly budgets,
            and understand your spending — all in one place.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => router.push("/register")}
            sx={{
              py: 1.5,
              mb: 2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Get Started — Create Account
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={() => router.push("/login")}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Already have an account? Log in
          </Button>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 4 }}
          >
            Your personal finances, organized.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
