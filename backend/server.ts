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
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(o => o.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
