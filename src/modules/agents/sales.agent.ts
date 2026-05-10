import { prisma } from '../../lib/prisma';
import { logger } from '../../observability/logger';

export class SalesAgent {
  /**
   * Identifies hot customer leads by analyzing scheduling frequency and interest categories.
   */
  public static async scoreLeads(organizationId?: string) {
    logger.info('🤖 Sales Agent scoring concierge leads profiles...');

    const bookings = await prisma.booking.findMany({
      where: organizationId ? { organizationId } : undefined,
    });

    if (bookings.length === 0) {
      return {
        leadsReviewed: 0,
        hotLeads: [],
        insight: 'No active leads on file. Trigger a promotional campaign to seed initial inquiries.',
      };
    }

    // Mathematical lead scoring based on statuses
    const leadRoster = bookings.map((b) => {
      let score = 50; // baseline score

      // Confirmed slot indicates high commitment
      if (b.status === 'confirmed') score += 30;
      
      // VIP tag indicates critical high-ticket net worth
      if (b.notes?.toUpperCase().includes('VIP')) score += 15;

      return {
        client: b.name,
        email: b.email,
        vehicleInterest: b.carInterest || 'General consultation',
        bookingId: b.id,
        score,
        tier: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
      };
    });

    const hotLeads = leadRoster.filter((l) => l.tier === 'HIGH').sort((a, b) => b.score - a.score);

    return {
      leadsReviewed: bookings.length,
      hotLeads,
      insight: hotLeads.length > 0 
        ? `Immediate action: Reach out to ${hotLeads[0].client} concerning their high interest in ${hotLeads[0].vehicleInterest}.`
        : 'Active leads are progressing at baseline levels. No hot escalations necessary.',
    };
  }
}
