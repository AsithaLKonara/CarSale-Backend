import { prisma } from '../../lib/prisma';

export const executeGlobalSearch = async (query: string) => {
  if (!query || query.trim() === '') {
    return { cars: [], bookings: [], logs: [] };
  }

  const cleanQuery = query.trim();

  // Search across three tables concurrently
  const [cars, bookings, logs] = await Promise.all([
    prisma.car.findMany({
      where: {
        OR: [
          { brand: { contains: cleanQuery, mode: 'insensitive' } },
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),

    prisma.booking.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { email: { contains: cleanQuery, mode: 'insensitive' } },
          { carInterest: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),

    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: cleanQuery, mode: 'insensitive' } },
          { entity: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    cars,
    bookings,
    logs,
  };
};
