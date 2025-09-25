const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const requestCounter = new client.Counter({
  name: 'agentic_requests_total',
  help: 'Total number of requests',
  labelNames: ['route', 'method', 'status']
});

const requestDuration = new client.Histogram({
  name: 'agentic_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['route', 'method', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5] // contoh bucket
});

function middleware() {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const route = req.route?.path || req.path || 'unknown';
      const duration = (Date.now() - start) / 1000; // dalam detik

      requestCounter.inc({ route, method: req.method, status: res.statusCode }, 1);
      requestDuration.observe({ route, method: req.method, status: res.statusCode }, duration);
    });

    next();
  };
}

function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  client.register.metrics()
    .then(m => res.send(m))
    .catch(err => res.status(500).send(err.message));
}

module.exports = { middleware, metricsHandler };
