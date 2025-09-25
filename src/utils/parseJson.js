function parseJson(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error("JSON parse error:", err.message);
    return fallback;
  }
}

module.exports = parseJson;