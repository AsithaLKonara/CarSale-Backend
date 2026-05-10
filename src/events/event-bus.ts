import { logger } from '../observability/logger';

export type EventType =
  | 'CAR_CREATED'
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_COMPLETED'
  | 'NOTIFICATION_SENT'
  | 'ANALYTICS_RECORDED'
  | 'USER_LOGGED_IN';

export interface DomainEvent<T = any> {
  id: string;
  type: EventType;
  timestamp: string;
  organizationId?: string;
  data: T;
}

export type SubscriberHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

interface SubscriptionInstance {
  id: string;
  handler: SubscriberHandler;
}

class EventBus {
  private subscribers = new Map<EventType, SubscriptionInstance[]>();
  private eventStore: DomainEvent[] = []; // Memory persistence to support event-replay capabilities
  private dlq: { event: DomainEvent; subscriberId: string; error: string }[] = [];

  /**
   * Subscribe to a standard core event category.
   * Returns an unsubscription token ID.
   */
  public subscribe<T = any>(type: EventType, handler: SubscriberHandler<T>): string {
    const subId = `sub_${Math.random().toString(36).substring(2, 11)}`;
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    this.subscribers.get(type)!.push({ id: subId, handler });
    logger.info(`📡 Event Bus subscription registered for [${type}] (Sub ID: ${subId})`);
    return subId;
  }

  /**
   * Publish a typed domain event, forwarding payloads to all asynchronous subscribers.
   */
  public async publish<T = any>(type: EventType, data: T, organizationId?: string): Promise<void> {
    const event: DomainEvent<T> = {
      id: `evt_${Math.random().toString(36).substring(2, 11)}`,
      type,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };

    // Store in historical record to support events replay/audit compliance
    this.eventStore.push(event);
    logger.info(`📣 Event published: [${type}] (Event ID: ${event.id})`);

    const subs = this.subscribers.get(type) || [];
    
    // Asynchronously dispatch to all registered listeners (non-blocking)
    for (const sub of subs) {
      setImmediate(async () => {
        let attempts = 3;
        while (attempts > 0) {
          try {
            await sub.handler(event);
            return; // Success, exit retry loop
          } catch (err) {
            attempts--;
            logger.warn(`⚠️ Subscriber [${sub.id}] failed for event [${type}]. Attempts remaining: ${attempts}. Error: ${(err as Error).message}`);
            if (attempts === 0) {
              logger.error(`🚨 Subscriber [${sub.id}] failed permanently for [${type}]. Relocating to Dead Letter Queue (DLQ).`);
              this.dlq.push({
                event,
                subscriberId: sub.id,
                error: (err as Error).message,
              });
            }
          }
        }
      });
    }
  }

  /**
   * Replays historical event logs from a starting timestamp point.
   */
  public async replay(since: string, handler: SubscriberHandler): Promise<number> {
    const sinceTime = new Date(since).getTime();
    const matches = this.eventStore.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);

    logger.info(`🔄 Replaying ${matches.length} historical events to diagnostic stream.`);
    for (const e of matches) {
      try {
        await handler(e);
      } catch (err) {
        logger.error(`❌ Event replay fail on [${e.type}] (Event ID: ${e.id}): ${(err as Error).message}`);
      }
    }
    return matches.length;
  }

  /**
   * Returns current status of dead-letter items.
   */
  public getDLQ() {
    return this.dlq;
  }

  /**
   * Purges historic logs.
   */
  public clearStore() {
    this.eventStore = [];
    this.dlq = [];
  }
}

export const eventBus = new EventBus();
export default eventBus;
