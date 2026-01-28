require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const trucksRoutes = require("./routes/trucksRoutes");
const quotesRoutes = require("./routes/quotesRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadsRoutes = require("./routes/uploadsRoutes");
const db = require("./db");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const { ensureSchema } = require("./initDb");
const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";

// Opcional: respetar cabeceras de proxy para IP correcta en rate limiting
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", true);
}

if (isProd) {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");
  if (!process.env.FRONTEND_ORIGIN) missing.push("FRONTEND_ORIGIN");
  if (missing.length) {
    console.error(
      "Faltan variables de entorno requeridas en producción:",
      missing.join(", "),
    );
    process.exit(1);
  }
  const badSecret =
    String(process.env.JWT_SECRET).includes("dev_temp_") ||
    String(process.env.JWT_REFRESH_SECRET).includes("dev_temp_");
  if (badSecret) {
    console.error("Secretos JWT inseguros en producción.");
    process.exit(1);
  }
}

const whitelist = isProd
  ? [process.env.FRONTEND_ORIGIN]
  : [
      process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (whitelist.indexOf(origin) !== -1) return callback(null, true);
      try {
        const u = new URL(origin);
        const isLocalHost =
          u.hostname === "localhost" || u.hostname === "127.0.0.1";
        const isLanDev = !isProd && u.port === "5173";
        if (isLocalHost || isLanDev) return callback(null, true);
      } catch {}
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
// Handle CORS preflight for all routes (Express 5 safe)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.set(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization",
    );
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "200kb" }));

// Headers de seguridad básicos (sin dependencias externas)
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set("Cross-Origin-Resource-Policy", "same-origin");
  res.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Rate limiting simple en memoria por IP (ventana fija)
const RATE_ENABLED = process.env.RATE_ENABLED !== "false" && isProd;
if (RATE_ENABLED) {
  const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  const RATE_MAX = Number(process.env.RATE_MAX || 300); // por ventana
  const rateMap = new Map();
  app.use((req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    let rec = rateMap.get(ip);
    if (!rec || now - rec.start > RATE_WINDOW_MS) {
      rec = { start: now, count: 0 };
      rateMap.set(ip, rec);
    }
    rec.count += 1;
    if (rec.count > RATE_MAX) {
      return res
        .status(429)
        .json({ error: "Demasiadas solicitudes. Intenta más tarde." });
    }
    next();
  });
}

// Rate limit específico para login
if (RATE_ENABLED) {
  const LOGIN_WINDOW_MS = 5 * 60 * 1000;
  const LOGIN_MAX = Number(process.env.RATE_LOGIN_MAX || 30);
  const loginMap = new Map();
  app.use("/auth/login", (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    let rec = loginMap.get(ip);
    if (!rec || now - rec.start > LOGIN_WINDOW_MS) {
      rec = { start: now, count: 0 };
      loginMap.set(ip, rec);
    }
    rec.count += 1;
    if (rec.count > LOGIN_MAX) {
      return res
        .status(429)
        .json({ error: "Demasiados intentos de login. Intenta más tarde." });
    }
    next();
  });
}

// Logging estructurado y métricas
const metrics = { total: 0, byRoute: {} };
app.use((req, res, next) => {
  const reqId = crypto.randomUUID();
  const start = Date.now();
  res.on("finish", () => {
    const dur = Date.now() - start;
    const key = `${req.method} ${req.path}`;
    metrics.total += 1;
    metrics.byRoute[key] = metrics.byRoute[key] || { count: 0, status: {} };
    metrics.byRoute[key].count += 1;
    const s = res.statusCode;
    metrics.byRoute[key].status[s] = (metrics.byRoute[key].status[s] || 0) + 1;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        reqId,
        method: req.method,
        path: req.path,
        status: s,
        dur_ms: dur,
        userId: req.user && req.user.id,
      }),
    );
  });
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/trucks", trucksRoutes);
app.use("/quotes", quotesRoutes);
app.use("/ai", aiRoutes);
app.use("/admin", adminRoutes);
app.use("/uploads", uploadsRoutes);
const authController = require("./controllers/authController");
app.post("/auth/refresh", authController.refresh);
console.log("Ruta /auth/refresh montada directamente");
// Endpoints de prueba eliminados

// Redundante: endpoint GET informativo para /ai/assist
app.get("/ai/assist", (req, res) => {
  res.json({
    info: "Usa POST /ai/assist con JSON { role, project_description, existing_assets }. Si no hay créditos o clave, se entrega respuesta de fallback.",
  });
});

// Root endpoint for health check
app.get("/", (req, res) => {
  res.send("API de Mudanza App funcionando.");
});

app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.get("/ready", async (req, res) => {
  try {
    await db.raw("select 1");
    res.json({ ready: true });
  } catch {
    res.status(500).json({ ready: false });
  }
});

app.get("/metrics", (req, res) => {
  res.json(metrics);
});
// Logs de depuración eliminados

// Error handling middleware
app.use((err, req, res, next) => {
  const msg = err && err.message ? err.message : String(err);
  if (err && err.stack) {
    console.error(err.stack);
  } else {
    console.error(msg);
  }
  res.status(500).json({ error: "Algo salió mal!", detail: msg });
});

const server = app.listen(PORT, async () => {
  try {
    if (!isProd) {
      await ensureSchema();
    }
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn(
        "Advertencia: usando secretos JWT por defecto. Define JWT_SECRET y JWT_REFRESH_SECRET en .env para producción.",
      );
    }
  } catch (e) {
    console.error("Error inicializando esquema:", e);
  }
});

const shutdown = async () => {
  try {
    await new Promise((resolve) => server.close(resolve));
    await db.destroy();
  } finally {
    process.exit(0);
  }
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
