
# Agentic AI - Backend Server

Backend server for Agentic AI, enabling users to query locations or points of interest and receive interactive maps (iframe embed or link) generated based on an LLM response.

Note: This project uses Ollama as the LLM, and OpenStreetMap for map services due to Google Maps API payment constraints.

## 🔗 Links
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ai-maps-client.vercel.app/)

## Features

- LLM Integration
    - Uses Ollama to extract short location queries from user prompts.
    - Configurable model (default: `mistral`).

- Maps Integration
    - Uses OpenStreetMap for location search.
    - Provides embed iframe maps and direct map URLs.
    - Includes nearby POIs using Overpass API.

- API Security
    - All API endpoints require API Key authentication.
    - Global rate limiting to prevent abuse (configurable via environment variables).

- Observability
    - Logging using `morgan` with a custom logger.
    - Metrics endpoint `/metrics` for monitoring.
    - Optional Sentry integration for error tracking.

- Middleware
    - `helmet` for security headers.
    - `cors` with whitelist origin from environment variables.
    - JSON body parsing with a size limit of 10KB.
    - Global error handling for uncaught errors.
    - Health & Monitoring

- Health & Monitoring
    - `/health` endpoint for status checks.
    - `/metrics` endpoint for observability.
## Backend Architecture

```
Client (React/Vite)
        |
        v
  [API Gateway] (Express.js)
        |
        +--> RateLimiter & API Key Middleware
        |
        +--> Routes (/api)
              |
              +--> Agent Route (/ask)
                    |
                    +--> Ollama LLM (Dockerized)
                    |       - Extracts location query
                    |
                    +--> OpenStreetMap Services
                            - Geocoding
                            - Nearby POIs via Overpass
                            - Builds iframe & map URL
        |
        v
   Response JSON
```
Dockerized Components:
- `ollama` : LLM server
- `redis` : caching & session storage
- `backend` : Express.js API server
- Volume `ollama_models` for persistent LLM models
## Environment Variables
Set in `.env` (or directly in Docker Compose):

```
NODE_ENV=development
PORT=3000
CORS=["http://localhost:4173"]

# LLM (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_TIMEOUT=120000

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_WINDOW_MS=60000
RATE_MAX=30

# API Key Management
API_KEYS=my-test-key-123

# Error Tracking
SENTRY_DSN=

# Observability
LOG_LEVEL=info
METRICS_PORT=3001
METRICS_PATH=/metrics

# OSM Services
OSM_NOMINATIM_URL=https://nominatim.openstreetmap.org
OSM_OVERPASS_URL=https://overpass-api.de/api/interpreter
```
## Installation

Docker Setup

1. Build & Start Containers
```bash
  docker-compose up -d --build
```

2. Pull Ollama Model
```bash
  docker exec -it ollama bash
  ollama pull mistral
```

3. Test API Endpoint
```bash
  curl -X POST \
    'http://localhost:3000/api/ask' \
    --header 'Accept: */*' \
    --header 'Content-Type: application/json' \
    --header 'x-api-key: my-test-key-123' \
    --data-raw '{
      "question":"monas jakarta"
  }'
```
## API Reference

#### Ask AI

```
  POST /api/ask
```

Request Body

```
{
  "question": "Monas Jakarta"
}
```

Response

```
{
  "answer": "Search result for \"Monas Jakarta\" (query: \"monas jakarta\")",
  "query": "monas jakarta",
  "location": {
    "name": "Monumen Nasional, Jakarta",
    "lat": -6.175392,
    "lon": 106.827153,
    "type": "landmark",
    "address": {...},
    "extratags": {...},
    "map_url": "https://www.openstreetmap.org/?mlat=-6.175392&mlon=106.827153#map=18/-6.175392/106.827153",
    "embed_iframe": "<iframe width=\"600\" height=\"450\" src=\"...\"></iframe>",
    "nearby": [...]
  }
}
```
- If no location is found, the server returns a natural language response with alternative keywords for the user to try.
## Highlights

  - Fully Dockerized architecture
  - Ollama LLM for query extraction
  - OpenStreetMap for mapping (free, no payment required)
  - API Key & Rate Limiting security
  - Observability: Metrics, Logging, Health Check
  - Optional Sentry error tracking
