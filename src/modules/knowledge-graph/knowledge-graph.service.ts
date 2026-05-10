import { prisma } from '../../lib/prisma';
import { logger } from '../../observability/logger';

interface GraphNode {
  id: string;
  label: string;
  type: 'User' | 'Car' | 'Booking' | 'Organization';
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export class KnowledgeGraphService {
  /**
   * Constructs an organic relationships network graph detailing dealership associations.
   */
  public static async buildTenantGraph(organizationId?: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    logger.info('🕸️ Constructing multi-tenant intelligence Knowledge Graph...');

    const [bookings, cars] = await Promise.all([
      prisma.booking.findMany({
        where: organizationId ? { organizationId } : undefined,
      }),
      prisma.car.findMany({
        where: organizationId ? { organizationId } : undefined,
      }),
    ]);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    const addNode = (id: string, label: string, type: 'User' | 'Car' | 'Booking' | 'Organization') => {
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({ id, label, type });
      }
    };

    // 1. Map Organization node
    const orgId = organizationId || 'default-hq';
    addNode(orgId, 'UltraDrive HQ', 'Organization');

    // 2. Index inventory nodes
    cars.forEach((car) => {
      const carNodeId = `car_${car.id}`;
      addNode(carNodeId, `${car.brand} ${car.name}`, 'Car');
      
      // Edge: Organization OWNS vehicle
      edges.push({
        source: orgId,
        target: carNodeId,
        relationship: 'STOCKS_INVENTORY',
      });
    });

    // 3. Map reservation and user nodes
    bookings.forEach((b) => {
      const userNodeId = `usr_${b.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const bookingNodeId = `bkg_${b.id}`;

      addNode(userNodeId, b.name, 'User');
      addNode(bookingNodeId, `Booking #${b.id.substring(0, 6)}`, 'Booking');

      // Edge: User CREATED Booking
      edges.push({
        source: userNodeId,
        target: bookingNodeId,
        relationship: 'REQUESTED_APPOINTMENT',
      });

      // Edge: Booking CONTAINS Organization
      edges.push({
        source: bookingNodeId,
        target: orgId,
        relationship: 'ALLOCATED_TO_TENANT',
      });

      // Edge: User INTERESTED in Car if matching car exists in stock
      if (b.carInterest) {
        const matchingCar = cars.find((c) => c.name.toLowerCase() === b.carInterest?.toLowerCase() || c.brand.toLowerCase() === b.carInterest?.toLowerCase());
        if (matchingCar) {
          edges.push({
            source: userNodeId,
            target: `car_${matchingCar.id}`,
            relationship: 'INTERESTED_IN',
          });
        }
      }
    });

    logger.info(`✅ Knowledge Graph assembled with ${nodes.length} nodes and ${edges.length} relational edges.`);

    return { nodes, edges };
  }
}
