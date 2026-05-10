import { prisma } from '../lib/prisma';
import { logger } from '../observability/logger';

export class GDPRService {
  /**
   * Compiles and exports entire customer history file under standard portability clauses.
   */
  public static async exportUserData(email: string) {
    logger.info(`⚖️ Processing GDPR Portability Data Export request for customer: ${email}`);

    const [bookings, notifications] = await Promise.all([
      prisma.booking.findMany({
        where: { email },
      }),
      prisma.notification.findMany({
        where: { message: { contains: email } },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      subject: email,
      legalAuthority: 'GDPR Article 20 - Right to Data Portability',
      datasets: {
        conciergeBookingsCount: bookings.length,
        bookingsHistory: bookings,
        auditLogsMatches: notifications,
      },
    };
  }

  /**
   * Securely purges customer database records under Article 17 "Right to be Forgotten" retention compliance.
   */
  public static async eraseUserData(email: string): Promise<{ success: boolean; rowsDeleted: number }> {
    logger.warn(`⚖️ CRITICAL: Initiating permanent user erasure for profile: ${email}`);

    // Clean up corresponding Booking data records
    const deleteResult = await prisma.booking.deleteMany({
      where: { email },
    });

    logger.info(`⚖️ Secure purging completed successfully. Purged ${deleteResult.count} associated client files.`);

    return {
      success: true,
      rowsDeleted: deleteResult.count,
    };
  }
}
export default GDPRService;
