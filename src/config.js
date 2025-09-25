require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  cors: process.env.CORS || "http://localhost:5173",
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "mistral",
  ollamaTimeout: process.env.OLLAMA_TIMEOUT || 120000,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  rateLimit: {
    windowMs: parseInt(process.env.RATE_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_MAX, 10) || 30,
  },
  apiKeys: (process.env.API_KEYS || "").split(","),
  sentryDsn: process.env.SENTRY_DSN || "",
  logLevel: process.env.LOG_LEVEL || "info",
  metrics: {
    port: process.env.METRICS_PORT || 3001,
    path: process.env.METRICS_PATH || "/metrics",
  },
  osm: {
    nominatimUrl:
      process.env.OSM_NOMINATIM_URL || "https://nominatim.openstreetmap.org",
    overpassUrl:
      process.env.OSM_OVERPASS_URL || "https://overpass-api.de/api/interpreter",
  },
};
