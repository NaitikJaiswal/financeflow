
const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protect every transaction endpoint.
router.use(authMiddleware);

const validTypes = ["income", "expense"];

function validateTransaction(body) {
  const { description, amount, transaction_type, category, transaction_date } = body;

  if (
    typeof description !== "string" ||
    !description.trim() ||
    description.trim().length > 255
  ) {
    return "Description is required and must be at most 255 characters.";
  }

  if (
    amount === undefined ||
    amount === null ||
    amount === "" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    return "Amount must be a positive number.";
  }

  if (!validTypes.includes(transaction_type)) {
    return "Transaction type must be income or expense.";
  }

  if (
    typeof category !== "string" ||
    !category.trim() ||
    category.trim().length > 100
  ) {
    return "Category is required and must be at most 100 characters.";
  }

  if (transaction_date !== undefined) {
    if (
      typeof transaction_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date) ||
      !Number.isFinite(Date.parse(`${transaction_date}T00:00:00Z`)) ||
      new Date(`${transaction_date}T00:00:00Z`).toISOString().slice(0, 10) !== transaction_date
    ) {
      return "Transaction date must be a valid date in YYYY-MM-DD format.";
    }
  }

  return null;
}

// POST /api/transactions — add a transaction
router.post("/", async (req, res) => {
  try {
    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const {
      description,
      amount,
      transaction_type,
      category,
      transaction_date,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO public.transactions
        (user_id, description, amount, transaction_type, category, transaction_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
       RETURNING id, description, amount, transaction_type, category,
                 transaction_date, created_at`,
      [
        req.user.userId,
        description.trim(),
        Number(amount),
        transaction_type,
        category.trim(),
        transaction_date || null,
      ]
    );

    return res.status(201).json({
      message: "Transaction created successfully.",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);
    return res.status(500).json({
      message: "Unable to create transaction.",
    });
  }
});

// GET /api/transactions — list the logged-in user's transactions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, description, amount, transaction_type, category,
              transaction_date, created_at
       FROM public.transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC, created_at DESC`,
      [req.user.userId]
    );

    return res.json({
      count: result.rows.length,
      transactions: result.rows,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);
    return res.status(500).json({
      message: "Unable to retrieve transactions.",
    });
  }
});

// PUT /api/transactions/:id — update a transaction owned by this user
router.put("/:id", async (req, res) => {
  try {
    const error = validateTransaction(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const {
      description,
      amount,
      transaction_type,
      category,
      transaction_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE public.transactions
       SET description = $1,
           amount = $2,
           transaction_type = $3,
           category = $4,
           transaction_date = COALESCE($5::date, transaction_date)
       WHERE id = $6 AND user_id = $7
       RETURNING id, description, amount, transaction_type, category,
                 transaction_date, created_at`,
      [
        description.trim(),
        Number(amount),
        transaction_type,
        category.trim(),
        transaction_date || null,
        req.params.id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    return res.json({
      message: "Transaction updated successfully.",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        message: "Invalid transaction ID or date.",
      });
    }

    return res.status(500).json({
      message: "Unable to update transaction.",
    });
  }
});

// DELETE /api/transactions/:id — delete a transaction owned by this user
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM public.transactions
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    return res.json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        message: "Invalid transaction ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to delete transaction.",
    });
  }
});

module.exports = router;
