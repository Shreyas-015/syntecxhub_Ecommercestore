import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminOrderRoutes from "./routes/adminOrderRoutes";
import adminDashboardRoutes from "./routes/adminDashboardRoutes";
import adminUserRoutes from "./routes/adminUserRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import { verifyDbConnection } from "./middleware/dbCheckMiddleware";

const app = express();

// 1. Trust proxy (needed for accurate rate-limiting behind reverse proxies like Cloud Run/Nginx)
app.set("trust proxy", 1);

// 2. Global Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off for local Vite/HTML development if it gets in the way of style/image loads
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Enable CORS with credentials and client origin safety
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: [clientUrl, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 4. Request Logging (Morgan)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 5. Request body compression
app.use(compression());

// 6. Request Body Parsers
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, res, buf) => {
      if (req.originalUrl && req.originalUrl.includes("/webhooks")) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 7. Rate Limiter (Defensive Security Guard)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
    errors: null,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all api routes
app.use("/api/", limiter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  const databaseStatus = dbStates[dbState] || "unknown";
  const currentUptime = process.uptime();

  res.status(200).json({
    success: true,
    message: dbState === 1 ? "Service is fully operational" : "Service is running but database is offline",
    database: databaseStatus,
    uptime: currentUptime,
    data: {
      uptime: currentUptime,
      database: databaseStatus,
      status: "alive"
    },
    errors: dbState === 1 ? null : [{ field: "database", message: "Database connection is not established" }],
    timestamp: new Date().toISOString(),
  });
});

// 8. Mount Authentication Routes with Database Connection Verification Guard
app.use("/api/auth", verifyDbConnection, authRoutes);
app.use("/api/categories", verifyDbConnection, categoryRoutes);
app.use("/api/products", verifyDbConnection, productRoutes);
app.use("/api/cart", verifyDbConnection, cartRoutes);
app.use("/api/wishlist", verifyDbConnection, wishlistRoutes);
app.use("/api/addresses", verifyDbConnection, addressRoutes);
app.use("/api/orders", verifyDbConnection, orderRoutes);
app.use("/api/payments", verifyDbConnection, paymentRoutes);
app.use("/api/admin/orders", verifyDbConnection, adminOrderRoutes);
app.use("/api/admin/dashboard", verifyDbConnection, adminDashboardRoutes);
app.use("/api/admin/users", verifyDbConnection, adminUserRoutes);

// 9. Handle 404 Route misses on API routes specifically
app.use("/api/*", notFoundHandler);

// 10. Centralized Global Error middleware
app.use(globalErrorHandler);

export default app;
