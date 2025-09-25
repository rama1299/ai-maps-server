const nock = require('nock');
const { askOllamaExtractLocation } = require('../../src/services/ollama');
const config = require('../../src/config');

describe('Ollama service', () => {
  afterEach(() => nock.cleanAll());

  test('extracts location text from response', async () => {
    const sample = { response: 'best bakso malang' };

    nock(config.ollamaUrl)
      .post('/api/generate')
      .reply(200, sample);

    const res = await askOllamaExtractLocation('Where to eat bakso in Malang?');
    expect(res.toLowerCase()).toContain('bakso');
  });

  test('handles NO_LOCATION', async () => {
    nock(config.ollamaUrl)
      .post('/api/generate')
      .reply(200, { response: '' });

    const res = await askOllamaExtractLocation('random non location text');
    expect(res).toBe('NO_LOCATION');
  });
});
