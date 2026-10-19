
const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

function validateBudget(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A valid JSON request body is required.";
  }

  const { category, monthly_limit, month_start } = body;

  if (
    typeof category !== "string" ||
    !category.trim() ||
    category.trim().length > 100
  ) {
    return "Category is required and must be at most 100 characters.";
  }

  if (
    monthly_limit === undefined ||
    monthly_limit === null ||
    monthly_limit === "" ||
    !Number.isFinite(Number(monthly_limit)) ||
    Number(monthly_limit) <= 0
  ) {
    return "Monthly limit must be a positive number.";
  }

  if (month_start !== undefined && month_start !== null && month_start !== "") {
    if (
      typeof month_start !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(month_start) ||
      !Number.isFinite(Date.parse(`${month_start}T00:00:00Z`)) ||
      new Date(`${month_start}T00:00:00Z`).toISOString().slice(0, 10) !==
        month_start
    ) {
      return "Month start must be a valid date in YYYY-MM-DD format.";
    }

    if (!month_start.endsWith("-01")) {
      return "Month start must be the first day of a month.";
    }
  }

  return null;
}

// GET /api/budgets — list budgets and calculate spending

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.category,
         b.monthly_limit,
         TO_CHAR(b.month_start, 'YYYY-MM-DD') AS month_start,
         b.created_at,
         COALESCE(
           (
             SELECT SUM(t.amount)
             FROM public.transactions t
             WHERE t.user_id = b.user_id
               AND t.category = b.category
               AND t.transaction_type = 'expense'
               AND t.transaction_date >= b.month_start
               AND t.transaction_date <
                   (b.month_start + INTERVAL '1 month')
           ),
           0
         ) AS spent
       FROM public.budgets b
       WHERE b.user_id = $1
       ORDER BY b.month_start DESC, b.category ASC`,
      [req.user.userId]
    );

    res.json({
      count: result.rows.length,
      budgets: result.rows,
    });
  } catch (error) {
    console.error("Get budgets error:", error.message);
    res.status(500).json({ message: "Unable to retrieve budgets." });
  }
});


// POST /api/budgets — create a budget
router.post("/", async (req, res) => {
  try {
    const validationError = validateBudget(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { category, monthly_limit, month_start } = req.body;

    const result = await pool.query(
      `INSERT INTO public.budgets
         (user_id, category, monthly_limit, month_start)
       VALUES (
         $1,
         $2,
         $3,
         COALESCE($4::date, date_trunc('month', CURRENT_DATE)::date)
       )
       RETURNING id, user_id, category, monthly_limit, month_start, created_at`,
      [
        req.user.userId,
        category.trim(),
        Number(monthly_limit),
        month_start || null,
      ]
    );

    const budget = result.rows[0];

res.status(201).json({
  message: "Budget created successfully.",
  budget: {
    ...budget,
    month_start:
      typeof budget.month_start === "string"
        ? budget.month_start.slice(0, 10)
        : budget.month_start,
    spent: "0",
  },
});
  

  } catch (error) {
    console.error("Create budget error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "A budget for this category and month already exists. Please edit the existing budget instead.",
      });
    }

    return res.status(500).json({
      message: "Unable to create budget.",
    });
  }
});


// PUT /api/budgets/:id — update a budget owned by this user
router.put("/:id", async (req, res) => {
  try {
    const validationError = validateBudget(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { category, monthly_limit, month_start } = req.body;

    const result = await pool.query(
      `UPDATE public.budgets
       SET category = $1,
           monthly_limit = $2,
           month_start = COALESCE($3::date, month_start)
       WHERE id = $4 AND user_id = $5
       RETURNING id, category, monthly_limit, month_start, created_at`,
      [
        category.trim(),
        Number(monthly_limit),
        month_start || null,
        req.params.id,
        req.user.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Budget not found." });
    }

    res.json({
      message: "Budget updated successfully.",
      budget: result.rows[0],
    });
  } catch (error) {
    console.error("Update budget error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({ message: "Invalid budget ID or date." });
    }

    res.status(500).json({ message: "Unable to update budget." });
  }
});

// DELETE /api/budgets/:id — delete a budget owned by this user
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM public.budgets
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Budget not found." });
    }

    res.json({ message: "Budget deleted successfully." });
  } catch (error) {
    console.error("Delete budget error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({ message: "Invalid budget ID." });
    }

    res.status(500).json({ message: "Unable to delete budget." });
  }
});

module.exports = router;
