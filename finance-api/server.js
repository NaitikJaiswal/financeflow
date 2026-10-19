require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://financeflow-sigma-two.vercel.app",
];

// CORS configuration — must be before API routes
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header (e.g. health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "FinanceFlow API is running!" });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);

// Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`FinanceFlow API running on port ${PORT}`);
});