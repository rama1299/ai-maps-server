const express = require("express");
const Joi = require("joi");
const {
  askOllamaExtractLocation,
  askOllamaFallbackAnswer,
} = require("../services/ollama");
const { searchPlaceByQuery } = require("../services/osm");
const logger = require("../utils/logger");

const router = express.Router();

const bodySchema = Joi.object({
  question: Joi.string().min(3).required(),
  embedWidth: Joi.number().integer().min(200).max(1200).optional(),
  embedHeight: Joi.number().integer().min(200).max(1200).optional(),
});

router.post("/ask", async (req, res) => {
  const { error, value } = bodySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { question, embedWidth = 600, embedHeight = 450 } = value;
  try {
    const locationQuery = await askOllamaExtractLocation(question);
    if (!locationQuery || locationQuery === "NO_LOCATION") {

        const fallbackAnswer = await askOllamaFallbackAnswer(question);
      return res.json({ answer: fallbackAnswer, location: null });
    }

    const place = await searchPlaceByQuery(locationQuery);
    if (!place) {

        const fallbackAnswer = await askOllamaFallbackAnswer(question);
      return res.json({
        answer: fallbackAnswer,
        query: locationQuery,
        location: null,
      });
    }

    const iframe = place.embed_iframe
      .replace(/width="\d+"/, `width="${embedWidth}"`)
      .replace(/height="\d+"/, `height="${embedHeight}"`);

    res.json({
      answer: `Hasil pencarian untuk "${question}" (query: "${locationQuery}")`,
      query: locationQuery,
      location: {
        name: place.name,
        lat: place.lat,
        lon: place.lon,
        type: place.type,
        address: place.address,
        extratags: place.extratags,
        map_url: place.map_url,
        embed_iframe: iframe,
        nearby: place.nearby,
      },
    });
  } catch (err) {
    logger.error("Agent error", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
