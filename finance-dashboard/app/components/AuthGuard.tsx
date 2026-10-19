
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyLogin() {
      const token = localStorage.getItem("financeflow_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("financeflow_token");
          localStorage.removeItem("financeflow_user");
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to verify your login. Please check that the backend is running."
          );
        }
      }
    }

    verifyLogin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <CircularProgress />
            <Typography color="text.secondary">
              Verifying your login...
            </Typography>
          </>
        )}
      </Box>
    );
  }

  return <>{children}</>;
}
