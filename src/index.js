const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require('@sentry/node');

const config = require('./config');
const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const authApiKey = require('./middleware/authApiKey');
const agentRoutes = require('./routes/agent');
const metrics = require('./telemetry/metrics');
const parseJson = require('./utils/parseJson');

if (config.sentryDsn) {
  Sentry.init({ dsn: config.sentryDsn });
}

const app = express();

app.use(helmet());
app.use(cors({ origin: parseJson(config.cors, []) }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(metrics.middleware());

if (config.sentryDsn) app.use(Sentry.Handlers.requestHandler());

// Global rate limiter
app.use(rateLimiter);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Metrics
app.get('/metrics', metrics.metricsHandler);

// Protected API
app.use('/api', authApiKey, agentRoutes);

// Sentry error handler
if (config.sentryDsn) app.use(Sentry.Handlers.errorHandler());

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => logger.info(`Agentic server started on port ${config.port}`));
