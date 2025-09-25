const config = require('../config');

module.exports = (req, res, next) => {
  const key = req.header('x-api-key');
  if (!key) return res.status(401).json({ error: 'API key required' });

  if (!config.apiKeys.includes(key)) return res.status(403).json({ error: 'Invalid API key' });

  // attach client info for quota / metrics
  req.client = { apiKey: key };
  next();
};
