import { openApiComponents } from './components.js';
import { openApiPaths } from './paths.js';

/** OpenAPI 3.0 document — source for Swagger UI and `/api/openapi.json`. */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Evvnt API',
    version: '0.3.0',
    description:
      'Nigeria-first event OS — REST API v1. Successful responses wrap payloads as `{ ok: true, data: ... }`. Errors use `{ ok: false, error: { code, message, details? } }`. Includes **Module 09 — Event Planner** (hall + cost calculator APIs).',
  },
  servers: [{ url: '/', description: 'Current host (e.g. http://localhost:4000)' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Events' },
    { name: 'Guests' },
    { name: 'RSVP' },
    { name: 'Payments' },
    { name: 'Ticketing' },
    { name: 'Vendors' },
    { name: 'Finance' },
    { name: 'Gifts' },
    { name: 'Gallery' },
    { name: 'Notifications' },
    { name: 'Event Planner' },
  ],
  paths: openApiPaths as unknown as Record<string, unknown>,
  components: openApiComponents as unknown as Record<string, unknown>,
};
