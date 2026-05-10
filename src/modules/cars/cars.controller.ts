import { Request, Response, NextFunction } from 'express';
import { carsService } from './cars.service';
import { logAction } from '../audit/audit.service';
import { broadcastToAdmins, broadcastGlobal } from '../../socket';
import { createNotification } from '../notifications/notifications.service';
import { getCache, setCache, clearCache } from '../../lib/redis';
import { sendCarSoldAlert } from '../email/email.service';

class CarsController {
  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query; // Already validated and formatted by validation.middleware
      const orgId = req.organization?.id;
      const cacheKey = `cars:list:${orgId}:${JSON.stringify(filters)}`;

      // Try fetching from cache
      const cached = await getCache(cacheKey);
      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }

      const result = await carsService.getCarsList(filters, orgId);
      const responsePayload = {
        status: 'success',
        ...result,
      };

      // Store in Cache for 5 minutes (300 seconds)
      await setCache(cacheKey, JSON.stringify(responsePayload), 300);
      
      res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  };

  public getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const orgId = req.organization?.id;
      const cacheKey = `cars:slug:${orgId}:${slug}`;

      // Try fetching from cache
      const cached = await getCache(cacheKey);
      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }

      const car = await carsService.getCarBySlug(slug, orgId);
      const responsePayload = {
        status: 'success',
        data: { car },
      };

      // Store in Cache for 5 minutes (300 seconds)
      await setCache(cacheKey, JSON.stringify(responsePayload), 300);

      res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const car = await carsService.createCar(req.body, orgId);

      // Register Audit action
      await logAction({
        action: 'car_create',
        entity: 'Car',
        entityId: car.id,
        userId: req.user?.userId,
        metadata: { name: car.name, ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      // Register persistent Notification
      await createNotification({
        title: 'New Showroom Addition',
        message: `New model loaded: ${car.brand} ${car.name} specifications have been listed inside global inventory.`,
        type: 'inventory',
        organizationId: orgId,
      });

      // Invalidate fleet caches
      await clearCache('cars:*');

      // Broadcast Socket events
      broadcastToAdmins('car:created', car);
      broadcastGlobal('car:created', car);

      res.status(201).json({
        status: 'success',
        message: 'Vehicle specification created successfully',
        data: { car },
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const car = await carsService.updateCar(id, req.body);

      // Register Audit action
      await logAction({
        action: 'car_edit',
        entity: 'Car',
        entityId: car.id,
        userId: req.user?.userId,
        metadata: { name: car.name, ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      // Dispatch deal-closed notification email
      if (req.body.status === 'sold') {
        sendCarSoldAlert({
          brand: car.brand,
          name: car.name,
          price: car.price || 'N/A',
        }).catch((err) => console.error('Car sold alert email failure:', err));
      }

      // Invalidate fleet caches
      await clearCache('cars:*');

      // Broadcast Socket events
      broadcastToAdmins('car:updated', car);

      res.status(200).json({
        status: 'success',
        message: 'Vehicle specifications updated successfully',
        data: { car },
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await carsService.deleteCar(id);

      // Register Audit action
      await logAction({
        action: 'car_delete',
        entity: 'Car',
        entityId: id,
        userId: req.user?.userId,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      // Invalidate fleet caches
      await clearCache('cars:*');

      // Broadcast Socket events
      broadcastToAdmins('car:deleted', { id });

      res.status(200).json({
        status: 'success',
        message: 'Vehicle specifications and nested sub-assets deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const orgId = req.organization?.id;
      const copy = await carsService.duplicateCar(id, orgId);

      await logAction({
        action: 'car_duplicate',
        entity: 'Car',
        entityId: copy.id,
        userId: req.user?.userId,
        metadata: { sourceId: id, ip: req.ip },
      });

      await clearCache('cars:*');
      broadcastToAdmins('car:created', copy);

      res.status(201).json({
        status: 'success',
        message: 'Vehicle listing duplicated successfully',
        data: { car: copy },
      });
    } catch (error) {
      next(error);
    }
  };

  public bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      const orgId = req.organization?.id;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ status: 'error', message: 'An array of matching vehicle IDs is required' });
        return;
      }

      await carsService.bulkDeleteCars(ids, orgId);

      await logAction({
        action: 'car_bulk_delete',
        entity: 'Car',
        userId: req.user?.userId,
        metadata: { deletedCount: ids.length, ip: req.ip },
      });

      await clearCache('cars:*');
      broadcastToAdmins('cars:bulk_deleted', { ids });

      res.status(200).json({
        status: 'success',
        message: `${ids.length} vehicle listings permanently removed`,
      });
    } catch (error) {
      next(error);
    }
  };

  public bulkPublish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      const orgId = req.organization?.id;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ status: 'error', message: 'An array of matching vehicle IDs is required' });
        return;
      }

      await carsService.bulkPublishCars(ids, orgId);

      await logAction({
        action: 'car_bulk_publish',
        entity: 'Car',
        userId: req.user?.userId,
        metadata: { publishedCount: ids.length, ip: req.ip },
      });

      await clearCache('cars:*');
      broadcastToAdmins('cars:bulk_published', { ids });

      res.status(200).json({
        status: 'success',
        message: `${ids.length} vehicle listings successfully published to live inventory`,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ status: 'error', message: 'Target status field parameter required' });
        return;
      }

      const updated = await carsService.updateCar(id, { status });

      await logAction({
        action: 'car_status_update',
        entity: 'Car',
        entityId: id,
        userId: req.user?.userId,
        metadata: { status, ip: req.ip },
      });

      await clearCache('cars:*');
      broadcastToAdmins('car:updated', updated);

      res.status(200).json({
        status: 'success',
        message: `Vehicle listing status updated successfully to: ${status}`,
        data: { car: updated },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const carsController = new CarsController();
