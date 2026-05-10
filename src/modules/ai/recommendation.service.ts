import { prisma } from '../../lib/prisma';
import { EmbeddingService } from './embedding.service';

export class RecommendationService {
  /**
   * Fetches similar supercar recommendations for a given model.
   * Weighs visual category overlap, technical specs, and description similarities.
   */
  public static async getSimilarCars(carId: string, limit = 3) {
    const targetCar = await prisma.car.findUnique({
      where: { id: carId },
      include: { specs: true },
    });

    if (!targetCar) {
      throw new Error(`Target vehicle ID '${carId}' does not exist.`);
    }

    // Get all cars within the same tenant context to ensure multi-tenant boundary isolation
    const candidates = await prisma.car.findMany({
      where: {
        id: { not: carId },
        organizationId: targetCar.organizationId,
      },
      include: { specs: true, images: true },
    });

    if (candidates.length === 0) return [];

    // Compile documents content
    const documents = [
      {
        id: targetCar.id,
        content: `${targetCar.brand} ${targetCar.name} ${targetCar.category} ${targetCar.description} ${targetCar.specs.map(s => s.value).join(' ')}`,
      },
      ...candidates.map((cand) => ({
        id: cand.id,
        content: `${cand.brand} ${cand.name} ${cand.category} ${cand.description} ${cand.specs.map(s => s.value).join(' ')}`,
      })),
    ];

    const vectors = EmbeddingService.createVectors(documents);
    const targetVector = vectors.find((v) => v.id === targetCar.id)?.vector;

    if (!targetVector) return [];

    // Calculate semantic score and map candidates
    const recommendations = candidates
      .map((cand) => {
        const candVector = vectors.find((v) => v.id === cand.id)?.vector;
        const semanticScore = candVector ? EmbeddingService.cosineSimilarity(targetVector, candVector) : 0;

        // Custom weighting boost for identical automotive categories (e.g., hypercar-to-hypercar)
        const categoryBoost = cand.category === targetCar.category ? 0.25 : 0;
        const totalScore = semanticScore + categoryBoost;

        return {
          car: cand,
          matchScore: Math.min(Math.round(totalScore * 100), 100), // Map to 1-100% scale
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Performs semantic vector search on fleet inventory.
   */
  public static async semanticSearch(query: string, organizationId?: string, limit = 5) {
    const cars = await prisma.car.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: { specs: true, images: true },
    });

    if (cars.length === 0 || !query.trim()) {
      return cars.map((c) => ({ car: c, score: 100 }));
    }

    // Embed documents list + query string document
    const queryDocId = 'user_search_query';
    const documents = [
      { id: queryDocId, content: query },
      ...cars.map((car) => ({
        id: car.id,
        content: `${car.brand} ${car.name} ${car.category} ${car.description} ${car.specs.map(s => s.value).join(' ')}`,
      })),
    ];

    const vectors = EmbeddingService.createVectors(documents);
    const queryVector = vectors.find((v) => v.id === queryDocId)?.vector;

    if (!queryVector) {
      return cars.map((c) => ({ car: c, score: 100 }));
    }

    return cars
      .map((car) => {
        const carVector = vectors.find((v) => v.id === car.id)?.vector;
        const score = carVector ? EmbeddingService.cosineSimilarity(queryVector, carVector) : 0;

        return {
          car,
          score: Math.min(Math.round(score * 100), 100),
        };
      })
      .filter((item) => item.score > 5) // Exclude completely irrelevant options
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Evaluates operations telemetry and lists conversion probability & customer interest ratios.
   */
  public static async getInterestMetrics(organizationId?: string) {
    const cars = await prisma.car.findMany({
      where: organizationId ? { organizationId } : undefined,
    });

    // Count interest points: bookings interest + views events
    const [bookings, viewEvents] = await Promise.all([
      prisma.booking.findMany({ where: organizationId ? { organizationId } : undefined }),
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'car_detail',
          organizationId: organizationId,
        },
      }),
    ]);

    return cars.map((car) => {
      const carBookingsCount = bookings.filter((b) => b.carInterest?.toLowerCase().includes(car.name.toLowerCase())).length;
      const carViewsCount = viewEvents.filter((v) => v.carId === car.id || v.path?.includes(car.slug)).length;

      // Mathematical interest score computation
      const baseScore = carViewsCount * 10 + carBookingsCount * 50;
      const conversionProbability = carViewsCount > 0 
        ? Math.min(Math.round((carBookingsCount / carViewsCount) * 100), 100) 
        : carBookingsCount > 0 ? 80 : 0;

      return {
        carId: car.id,
        name: `${car.brand} ${car.name}`,
        totalViews: carViewsCount,
        totalBookings: carBookingsCount,
        interestScore: Math.min(baseScore, 1000), // Caps at standard 1000 max score
        conversionRatePercent: conversionProbability,
      };
    }).sort((a, b) => b.interestScore - a.interestScore);
  }
}
