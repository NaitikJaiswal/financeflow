
"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  transaction_type: "income" | "expense";
  category: string;
  transaction_date: string;
};

type SpendingChartProps = {
  transactions: Transaction[];
};

const chartColors = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#F87171",
  "#06B6D4",
  "#EC4899",
  "#64748B",
];

export default function SpendingChart({
  transactions,
}: SpendingChartProps) {
  const expenses = transactions.filter(
    (transaction) => transaction.transaction_type === "expense"
  );

  const categoryTotals = expenses.reduce<Record<string, number>>(
    (totals, transaction) => {
      const category = transaction.category?.trim() || "Other";

      totals[category] =
        (totals[category] || 0) + Number(transaction.amount);

      return totals;
    },
    {}
  );

  const categories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const data = {
    labels: categories.map(([category]) => category),
    datasets: [
      {
        data: categories.map(([, amount]) => amount),
        backgroundColor: categories.map(
          (_, index) => chartColors[index % chartColors.length]
        ),
        borderWidth: 0,
        hoverOffset: 5,
      },
    ],
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #E9EDF4",
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Spending by category
        </Typography>

        {categories.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 5, textAlign: "center" }}
          >
            No expenses recorded yet. Add an expense to see your chart.
          </Typography>
        ) : (
          <Box sx={{ maxWidth: 320, mx: "auto" }}>
            <Doughnut
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const amount = Number(context.raw || 0);

                        return ` ${context.label}: ₹${amount.toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 2 }
                        )}`;
                      },
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
