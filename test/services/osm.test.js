const nock = require('nock');
const { searchPlaceByQuery } = require('../../src/services/osm');
const cache = require('../../src/services/cache');
const config = require('../../src/config');

jest.mock('../../src/services/cache');

describe('OSM service', () => {
  afterEach(() => nock.cleanAll());

  test('searchPlaceByQuery returns data when Nominatim returns result', async () => {
    const query = 'Bakso President Malang';

    nock(config.osm.nominatimUrl)
      .get('/search')
      .query(true)
      .reply(200, [
        {
          display_name: 'Bakso President, Malang, Jawa Timur, Indonesia',
          lat: '-7.98',
          lon: '112.63',
          type: 'restaurant',
          address: { city: 'Malang' }
        }
      ]);

    nock(config.osm.overpassUrl)
      .post('')
      .reply(200, { elements: [] });

    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue();

    const res = await searchPlaceByQuery(query);
    expect(res).toBeDefined();
    expect(res.name).toContain('Bakso President');
    expect(res.lat).toBeDefined();
    expect(res.map_url).toContain('openstreetmap.org');
  });

  test('returns null when no results', async () => {
    nock(config.osm.nominatimUrl)
      .get('/search')
      .query(true)
      .reply(200, []);

    cache.get.mockResolvedValue(null);

    const res = await searchPlaceByQuery('some random nothing');
    expect(res).toBeNull();
  });
});
