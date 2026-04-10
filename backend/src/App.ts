import 'reflect-metadata';
import express from 'express';
import type { Container } from 'inversify';

import { buildContainer } from './di/container.js';
import { TYPES } from './di/types.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { errorHandler, notFoundHandler } from './http/errors.js';
import { openApiDocument } from './openapi/openapiDocument.js';
import { ok } from './http/response.js';
import { buildAuthRouter } from './modules/auth/auth.routes.js';
import { buildEventsRouter } from './modules/events/events.routes.js';
import { buildGuestsRouter, buildPublicRsvpRouter } from './modules/guests/guests.routes.js';
import { buildPaymentsRouter } from './modules/payments/payments.routes.js';
import { buildTicketingRouter } from './modules/ticketing/ticketing.routes.js';
import { buildVendorsRouter } from './modules/vendors/vendors.routes.js';
import { buildFinanceRouter } from './modules/finance/finance.routes.js';
import { buildGiftsRouter } from './modules/gifts/gifts.routes.js';
import { buildGalleryRouter } from './modules/gallery/gallery.routes.js';
import { buildNotificationsRouter } from './modules/notifications/notifications.routes.js';
import { buildPlannerRouter } from './modules/planner/planner.routes.js';

export function createApp(container?: Container) {
  const c = container ?? buildContainer();
  const app = express();

  app.use(
    helmet({
      // Swagger UI uses inline scripts/styles
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.use(cors());

  // Capture raw body for webhook signature verification (Paystack)
  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(morgan('dev'));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'Evvnt API' }));

  app.get('/health', (_req, res) => {
    res.json(ok({ status: 'ok' as const }));
  });

  app.use('/api/v1/auth', buildAuthRouter(c.get(TYPES.AuthService)));
  app.use('/api/v1/events', buildEventsRouter(c.get(TYPES.EventsService)));
  app.use('/api/v1/events/:eventId/guests', buildGuestsRouter(c.get(TYPES.GuestsService)));

  // Public RSVP endpoint (no auth)
  app.use('/api/v1/rsvp', buildPublicRsvpRouter(c.get(TYPES.GuestsService)));

  // Payments webhooks (no auth)
  app.use('/api/v1/payments', buildPaymentsRouter(c.get(TYPES.TicketingService)));

  // Ticketing & check-in
  app.use('/api/v1/events/:eventId/ticketing', buildTicketingRouter(c.get(TYPES.TicketingService)));
  app.use('/api/v1/events/:eventId/vendors', buildVendorsRouter(c.get(TYPES.VendorsService)));
  app.use('/api/v1/events/:eventId/finance', buildFinanceRouter());
  app.use('/api/v1/events/:eventId/planner', buildPlannerRouter(c.get(TYPES.PlannerService)));
  app.use('/api/v1/events/:eventId/gifts', buildGiftsRouter(c.get(TYPES.GiftsService)));
  app.use('/api/v1/events/:eventId/gallery', buildGalleryRouter());
  app.use('/api/v1/notifications', buildNotificationsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

