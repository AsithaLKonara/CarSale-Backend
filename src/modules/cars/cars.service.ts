import { prisma } from '../../lib/prisma';
import { CarCreateInput, CarFilterQuery, CarUpdateInput } from './cars.types';

class CarsService {
  // 1. Paginated Listing with advanced real-dealership filtering
  public async getCarsList(filters: CarFilterQuery, organizationId?: string) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Apply primary filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    // Step 6 Filters: Price, Year, Mileage, Transmission, Fuel Type, Brand, Status
    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters.transmission) {
      where.transmission = { equals: filters.transmission, mode: 'insensitive' };
    }

    if (filters.fuelType) {
      where.fuelType = { equals: filters.fuelType, mode: 'insensitive' };
    }

    // Handle status filtering based on Admin or Showroom contexts
    if (filters.isAdmin === true || filters.isAdmin === 'true') {
      if (filters.status) {
        where.status = filters.status;
      }
    } else {
      // Showroom customers only see active cars, never draft, review, or archived cars
      if (filters.status) {
        if (['published', 'reserved', 'sold', 'available'].includes(filters.status)) {
          where.status = filters.status;
        } else {
          where.status = { in: ['published', 'reserved', 'sold', 'available'] };
        }
      } else {
        where.status = { in: ['published', 'reserved', 'sold', 'available'] };
      }
    }

    // Year range filters
    if (filters.yearMin || filters.yearMax) {
      where.year = {};
      if (filters.yearMin) where.year.gte = Number(filters.yearMin);
      if (filters.yearMax) where.year.lte = Number(filters.yearMax);
    }

    // Mileage range filters
    if (filters.mileageMin || filters.mileageMax) {
      where.mileage = {};
      if (filters.mileageMin) where.mileage.gte = Number(filters.mileageMin);
      if (filters.mileageMax) where.mileage.lte = Number(filters.mileageMax);
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [cars, totalCount] = await Promise.all([
      prisma.car.findMany({
        where,
        include: {
          images: true,
          specs: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.car.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      cars,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  // 2. Fetch single vehicle by slug
  public async getCarBySlug(slug: string, organizationId?: string) {
    const where: any = { slug };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const car = await prisma.car.findFirst({
      where,
      include: {
        images: true,
        specs: true,
      },
    });

    if (!car) {
      const error: any = new Error(`Vehicle with slug '${slug}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return car;
  }

  // 3. Create new luxury vehicle
  public async createCar(data: CarCreateInput, organizationId?: string) {
    const existing = await prisma.car.findUnique({ where: { slug: data.slug } });
    if (existing) {
      const error: any = new Error(`Vehicle with unique slug '${data.slug}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    if (data.isFeatured === true || data.featured === true) {
      const featuredCount = await prisma.car.count({
        where: {
          organizationId,
          OR: [
            { isFeatured: true },
            { featured: true }
          ]
        }
      });
      if (featuredCount >= 5) {
        const error: any = new Error('Organization has reached the maximum limit of 5 featured hypercars. Please unfeature another model first.');
        error.statusCode = 400;
        throw error;
      }
    }

    const { images, specs, ...carDetails } = data;
    const statusVal = data.status || 'draft';
    const publishedAtVal = (statusVal === 'published' || statusVal === 'available') ? new Date() : null;

    return prisma.car.create({
      data: {
        ...carDetails,
        status: statusVal,
        publishedAt: publishedAtVal,
        organizationId,
        images: {
          create: images,
        },
        specs: {
          create: specs,
        },
      },
      include: {
        images: true,
        specs: true,
      },
    });
  }

  // 4. Update vehicle and sub-assets
  public async updateCar(id: string, data: CarUpdateInput) {
    const existingCar = await prisma.car.findUnique({ where: { id } });
    if (!existingCar) {
      const error: any = new Error(`Vehicle with ID '${id}' could not be located`);
      error.statusCode = 404;
      throw error;
    }

    // 1. Sold cars become read-only: Reverting the status back to active is allowed,
    // but updating fields of a sold car is blocked.
    if (existingCar.status === 'sold') {
      const { status, ...restOfUpdate } = data;
      if (status !== undefined && status !== 'sold') {
        // Status revert is allowed
      } else if (Object.keys(restOfUpdate).length > 0) {
        const error: any = new Error('Sold vehicles are archived as read-only. Status can be reverted, but specs and assets cannot be modified.');
        error.statusCode = 400;
        throw error;
      }
    }

    // 2. Featured Limit Validation
    if (data.isFeatured === true || data.featured === true) {
      const wasFeatured = existingCar.isFeatured || existingCar.featured;
      if (!wasFeatured) {
        const featuredCount = await prisma.car.count({
          where: {
            organizationId: existingCar.organizationId,
            OR: [
              { isFeatured: true },
              { featured: true }
            ],
            id: { not: id }
          }
        });
        if (featuredCount >= 5) {
          const error: any = new Error('Organization has reached the maximum limit of 5 featured hypercars. Please unfeature another model first.');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    if (data.slug && data.slug !== existingCar.slug) {
      const slugConflict = await prisma.car.findUnique({ where: { slug: data.slug } });
      if (slugConflict) {
        const error: any = new Error(`Vehicle with unique slug '${data.slug}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    const { images, specs, ...carDetails } = data;
    const finalDetails: any = { ...carDetails };

    // 3. Set automatic timestamps
    if (data.status === 'sold' && existingCar.status !== 'sold') {
      finalDetails.soldAt = new Date();
    } else if (data.status !== 'sold' && existingCar.status === 'sold') {
      finalDetails.soldAt = null; // revert soldAt if reverting status
    }

    if ((data.status === 'published' || data.status === 'available') && 
        existingCar.status !== 'published' && existingCar.status !== 'available') {
      finalDetails.publishedAt = new Date();
    }

    return prisma.$transaction(async (tx) => {
      if (images) {
        await tx.carImage.deleteMany({ where: { carId: id } });
        await tx.carImage.createMany({
          data: images.map((img) => ({ ...img, carId: id })),
        });
      }

      if (specs) {
        await tx.carSpec.deleteMany({ where: { carId: id } });
        await tx.carSpec.createMany({
          data: specs.map((spec) => ({ ...spec, carId: id })),
        });
      }

      return tx.car.update({
        where: { id },
        data: finalDetails,
        include: {
          images: true,
          specs: true,
        },
      });
    });
  }

  // 5. Delete vehicle
  public async deleteCar(id: string) {
    const existing = await prisma.car.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error(`Vehicle with ID '${id}' could not be located`);
      error.statusCode = 404;
      throw error;
    }

    await prisma.car.delete({ where: { id } });
    return true;
  }

  // 6. Duplicate entire listing (duplicates images and specs too!)
  public async duplicateCar(id: string, organizationId?: string) {
    const source = await prisma.car.findFirst({
      where: { id, organizationId },
      include: { images: true, specs: true },
    });

    if (!source) {
      const error: any = new Error(`Vehicle with ID '${id}' could not be located`);
      error.statusCode = 404;
      throw error;
    }

    const timestamp = Date.now().toString().slice(-4);
    const newSlug = `${source.slug}-copy-${timestamp}`;

    return prisma.car.create({
      data: {
        name: `${source.name} (Copy)`,
        slug: newSlug,
        brand: source.brand,
        description: source.description,
        horsepower: source.horsepower,
        torque: source.torque,
        topSpeed: source.topSpeed,
        zeroTo100: source.zeroTo100,
        price: source.price,
        category: source.category,
        year: source.year,
        mileage: source.mileage,
        fuelType: source.fuelType,
        transmission: source.transmission,
        vin: source.vin ? `${source.vin}-copy` : null,
        condition: source.condition,
        status: 'draft', // duplicated items start as draft
        organizationId: source.organizationId,
        images: {
          create: source.images.map((img) => ({
            url: img.url,
            type: img.type,
          })),
        },
        specs: {
          create: source.specs.map((spec) => ({
            label: spec.label,
            value: spec.value,
          })),
        },
      },
      include: {
        images: true,
        specs: true,
      },
    });
  }

  // 7. Bulk Delete vehicles
  public async bulkDeleteCars(ids: string[], organizationId?: string) {
    await prisma.car.deleteMany({
      where: {
        id: { in: ids },
        organizationId,
      },
    });
    return true;
  }

  // 8. Bulk Publish vehicles (marks status as available and sets publishedAt)
  public async bulkPublishCars(ids: string[], organizationId?: string) {
    await prisma.car.updateMany({
      where: {
        id: { in: ids },
        organizationId,
      },
      data: {
        status: 'available',
        publishedAt: new Date(),
      },
    });
    return true;
  }
}

export const carsService = new CarsService();
