import { eventBus } from '../event-bus';
import { createNotification } from '../../modules/notifications/notifications.service';
import { logger } from '../../observability/logger';

/**
 * Initializes automatic system notification fanouts on core transaction events.
 */
export const initializeNotificationSubscribers = () => {
  // 1. Subscribe to BOOKING_CREATED dispatches
  eventBus.subscribe('BOOKING_CREATED', async (event) => {
    logger.info(`👂 Notification subscriber received BOOKING_CREATED event: ${event.id}`);
    const { name, carInterest } = event.data;
    
    await createNotification({
      title: 'New Booking Request Received',
      message: `VIP Client ${name} has submitted a viewing request for ${carInterest || 'general consultation'}.`,
      type: 'booking',
      organizationId: event.organizationId,
    });
  });

  // 2. Subscribe to CAR_CREATED dispatches
  eventBus.subscribe('CAR_CREATED', async (event) => {
    logger.info(`👂 Notification subscriber received CAR_CREATED event: ${event.id}`);
    const { brand, name } = event.data;

    await createNotification({
      title: 'New Showroom Inventory Added',
      message: `A new ${brand} ${name} catalog specification has been loaded into current showroom databases.`,
      type: 'inventory',
      organizationId: event.organizationId,
    });
  });
};
