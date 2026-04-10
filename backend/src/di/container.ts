import { Container } from 'inversify';

import { TYPES } from './types.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { EventsService } from '../modules/events/events.service.js';
import { GuestsService } from '../modules/guests/guests.service.js';
import { TicketingService } from '../modules/ticketing/ticketing.service.js';
import { VendorsService } from '../modules/vendors/vendors.service.js';
import { GiftsService } from '../modules/gifts/gifts.service.js';
import { PlannerService } from '../modules/planner/planner.service.js';

export function buildContainer() {
  const container = new Container({ defaultScope: 'Singleton' });

  container.bind(TYPES.AuditService).to(AuditService);
  container.bind(TYPES.NotificationsService).to(NotificationsService);
  container.bind(TYPES.AuthService).to(AuthService);
  container.bind(TYPES.EventsService).to(EventsService);
  container.bind(TYPES.GuestsService).to(GuestsService);
  container.bind(TYPES.TicketingService).to(TicketingService);
  container.bind(TYPES.VendorsService).to(VendorsService);
  container.bind(TYPES.GiftsService).to(GiftsService);
  container.bind(TYPES.PlannerService).to(PlannerService);

  return container;
}
