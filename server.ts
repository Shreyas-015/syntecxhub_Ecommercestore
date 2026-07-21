import "dotenv/config";
import express from "express";
import path from "path";
import { connectDB, closeDB } from "./server/src/config/db";
import app from "./server/src/app";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  // 1. Establish connection with MongoDB Atlas asynchronously so database timeouts don't block server startup
  connectDB().catch((err) => {
    console.warn("MongoDB asynchronous connection notice:", err?.message || err);
  });

  // 2. Set up graceful shutdown handlers
  process.on("SIGINT", async () => {
    await closeDB();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeDB();
    process.exit(0);
  });

  // 3. Integrate Vite middleware in development or serve static assets in production
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting server in DEVELOPMENT mode with Vite Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Use Vite's connect instance as a middleware
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the build output directory
    app.use(express.static(distPath));
    
    // SPA fallback route for client routing (always must be mounted after API routes)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 4. Bind and listen
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 Syntex Store Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to start the server engine:", err);
  process.exit(1);
});
