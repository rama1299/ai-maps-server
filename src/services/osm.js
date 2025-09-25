const axios = require('axios');
const cache = require('./cache');
const logger = require('../utils/logger');
const config = require('../config');

function buildEmbedIframe(lat, lon, width = 600, height = 450) {
  const src = `https://www.openstreetmap.org/export/embed.html?&marker=${lat},${lon}&layer=mapnik`;
  return `<iframe width="${width}" height="${height}" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

async function geocode(query) {
  const url = `${config.osm.nominatimUrl}/search`;
  const params = { q: query, format: 'json', addressdetails: 1, extratags: 1, limit: 5 };
  const { data } = await axios.get(url, {
    params,
    headers: { 'User-Agent': 'AgenticAI/1.0 (contact@example.com)' },
    timeout: 15_000
  });
  return data;
}

async function overpassPOIs(lat, lon, radius = 500, limit = 10) {
  const q = `
[out:json][timeout:10];
(
  node(around:${radius},${lat},${lon})[amenity];
  node(around:${radius},${lat},${lon})[tourism];
  way(around:${radius},${lat},${lon})[amenity];
  way(around:${radius},${lat},${lon})[tourism];
);
out center ${limit};
  `;
  const url = config.osm.overpassUrl;
  const { data } = await axios.post(url, q, {
    headers: { 'Content-Type': 'text/plain', 'User-Agent': 'AgenticAI/1.0' },
    timeout: 20_000
  });
  return data;
}

async function searchPlaceByQuery(query) {
  const key = `osm:search:${query.toLowerCase()}`;
  const cached = await cache.get(key);
  if (cached) return cached;

  const geos = await geocode(query);
  if (!geos || geos.length === 0) return null;
  const primary = geos[0];
  const lat = primary.lat;
  const lon = primary.lon;

  let nearby = null;
  try {
    const op = await overpassPOIs(lat, lon, 500, 10);
    nearby = op?.elements?.slice(0, 10) || null;
  } catch (e) {
    logger.warn('Overpass failed', { message: e.message });
  }

  const result = {
    name: primary.display_name,
    lat,
    lon,
    type: primary.type,
    address: primary.address || null,
    extratags: primary.extratags || null,
    map_url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`,
    embed_iframe: buildEmbedIframe(lat, lon),
    nearby
  };

  await cache.set(key, result, 3600);
  return result;
}

module.exports = { searchPlaceByQuery, buildEmbedIframe };
