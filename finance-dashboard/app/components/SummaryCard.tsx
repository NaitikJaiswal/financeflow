
"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  amount: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
};

export default function SummaryCard({
  title,
  amount,
  subtitle,
  icon,
  color,
}: SummaryCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #E9EDF4",
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              bgcolor: `${color}18`,
              color: color,
              borderRadius: 2,
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 800,
            color: "#172033",
            mb: 1,
          }}
        >
          {amount}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: "text.secondary",
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}
