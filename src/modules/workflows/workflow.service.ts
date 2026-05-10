import { eventBus, DomainEvent } from '../../events/event-bus';
import { createNotification } from '../notifications/notifications.service';
import { logger } from '../../observability/logger';

export interface WorkflowRule {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'contains';
    value: any;
  }[];
  actions: {
    type: 'send_email' | 'create_notification' | 'log_alert';
    params: Record<string, any>;
  }[];
}

class WorkflowAutomationEngine {
  private activeRules: WorkflowRule[] = [
    {
      id: 'rule_vip_booking_escalation',
      name: 'High-Priority VIP Booking Escalation',
      triggerEvent: 'BOOKING_CREATED',
      conditions: [
        { field: 'type', operator: 'equals', value: 'VIP' },
      ],
      actions: [
        {
          type: 'create_notification',
          params: {
            title: '🔥 VIP Lead Escalated',
            message: 'A prospective VIP booking requires immediate approval from sales advisors.',
            type: 'alert',
          },
        },
        {
          type: 'log_alert',
          params: { severity: 'CRITICAL', channel: 'sales-leads' },
        },
      ],
    },
  ];

  /**
   * Boots the workflow engine by binding listener subscriptions to the central Event Bus.
   */
  public initialize(): void {
    logger.info('⚙️ Workflow Automation Engine initializing...');
    
    // Bind global trigger catch-all evaluations
    const events: any[] = ['CAR_CREATED', 'BOOKING_CREATED', 'BOOKING_CONFIRMED', 'PAYMENT_COMPLETED'];
    events.forEach((evt) => {
      eventBus.subscribe(evt, (event) => this.evaluateEvent(event));
    });
  }

  /**
   * Processes a newly published Event Bus event against all active rules schemas.
   */
  private async evaluateEvent(event: DomainEvent): Promise<void> {
    const rulesToRun = this.activeRules.filter((r) => r.triggerEvent === event.type);
    
    for (const rule of rulesToRun) {
      let isMatch = true;

      // Evaluate rule conditions
      for (const cond of rule.conditions) {
        const value = event.data?.[cond.field];
        if (cond.operator === 'equals' && value !== cond.value) {
          isMatch = false;
        } else if (cond.operator === 'greater_than' && Number(value) <= Number(cond.value)) {
          isMatch = false;
        } else if (cond.operator === 'contains' && !String(value).includes(String(cond.value))) {
          isMatch = false;
        }
      }

      if (isMatch) {
        logger.info(`🎯 Workflow rule matching triggered: [${rule.name}] for Event [${event.type}]`);
        await this.executeActions(rule, event);
      }
    }
  }

  /**
   * Executes all mapped Actions within a triggered workflow rule.
   */
  private async executeActions(rule: WorkflowRule, event: DomainEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        if (action.type === 'create_notification') {
          await createNotification({
            title: action.params.title,
            message: `${action.params.message} (Triggered by client: ${event.data?.name || 'Anonymous'})`,
            type: action.params.type,
            organizationId: event.organizationId,
          });
        } else if (action.type === 'log_alert') {
          logger.warn(`🔔 Workflow Rule Custom Alert: [${rule.name}]`, {
            severity: action.params.severity,
            channel: action.params.channel,
            eventId: event.id,
          });
        }
      } catch (err) {
        logger.error(`❌ Action Execution Failure inside rule [${rule.name}]: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Appends or registers a new rule configuration.
   */
  public registerRule(rule: WorkflowRule): void {
    this.activeRules.push(rule);
    logger.info(`📦 Custom Workflow Rule Registered: [${rule.name}]`);
  }
}

export const workflowEngine = new WorkflowAutomationEngine();
export default workflowEngine;
