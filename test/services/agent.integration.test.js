const request = require('supertest');
const express = require('express');
const bodyParser = require('express').json;
const agentRoutes = require('../../src/routes/agent');
const config = require('../../src/config'); 

jest.mock('../../src/services/ollama', () => ({ askOllamaExtractLocation: jest.fn() }));
jest.mock('../../src/services/osm', () => ({ searchPlaceByQuery: jest.fn() }));

const { askOllamaExtractLocation } = require('../../src/services/ollama');
const { searchPlaceByQuery } = require('../../src/services/osm');

function buildApp() {
  const app = express();
  app.use(bodyParser());
  app.use('/api', (req, res, next) => {
    req.client = { apiKey: config.apiKeys[0] || 'dummy' };
    next();
  }, agentRoutes);
  return app;
}

describe('Agent route integration', () => {
  test('returns place when LLM gives query and OSM returns place', async () => {
    askOllamaExtractLocation.mockResolvedValue('bakso malang');
    searchPlaceByQuery.mockResolvedValue({
      name: 'Bakso President, Malang',
      lat: '-7.98',
      lon: '112.63',
      embed_iframe: '<iframe width="600" height="450"></iframe>',
      map_url: 'https://openstreetmap.org/...'
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/ask')
      .send({ question: 'Where to eat bakso in Malang?' })
      .set('x-api-key', config.apiKeys[0]);

    expect(res.statusCode).toBe(200);
    expect(res.body.location.name).toContain('Bakso');
    expect(res.body.location.map_url).toContain('openstreetmap');
  });

  test('returns error if validation fails', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/ask')
      .send({ question: '' })
      .set('x-api-key', config.apiKeys[0]);

    expect(res.statusCode).toBe(400);
  });
});
