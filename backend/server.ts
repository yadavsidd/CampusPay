import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import marketplaceRouter from "./routes/marketplace.ts";
import gigsRouter from "./routes/gigs.ts";
import expensesRouter from "./routes/expenses.ts";
import historyRouter from "./routes/history.ts";
import activitiesRouter from "./routes/activities.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow frontend origin
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use("/api", marketplaceRouter);
app.use("/api", gigsRouter);
app.use("/api", expensesRouter);
app.use("/api", historyRouter);
app.use("/api", activitiesRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
