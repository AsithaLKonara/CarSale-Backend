import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { logAction } from '../audit/audit.service';
import fs from 'fs';

// Configure Cloudinary if environments are seeded
const hasCloudinary = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ Cloudinary engine initialized successfully');
} else {
  console.log('📂 Cloudinary credentials unseeded. Falling back to localized local disk streams');
}

class MediaController {
  public uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        const error: any = new Error('No asset file was provided for upload');
        error.statusCode = 400;
        throw error;
      }

      let fileUrl = '';
      let isCloud = false;

      // Try uploading to Cloudinary
      if (hasCloudinary) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'ultradrive_fleet',
            resource_type: 'auto',
            // Cloudinary optimizations: dynamic resizing & WebP compression
            transformation: req.file.mimetype.startsWith('image/') 
              ? [{ width: 1920, crop: 'limit' }, { fetch_format: 'webp', quality: 'auto' }]
              : undefined,
          });
          fileUrl = result.secure_url;
          isCloud = true;

          // Delete localized file after uploading to cloud to save server disk space
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to unlink temporary upload local file:', err.message);
          });
        } catch (cloudErr) {
          console.error('Cloudinary transfer failed. Executing fallback local disk save:', (cloudErr as Error).message);
        }
      }

      // Fall back to local file URL if Cloudinary was unseeded or failed
      if (!fileUrl) {
        const host = req.get('host');
        const protocol = req.protocol;
        fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }

      // Log action audit log
      await logAction({
        action: 'media_upload',
        entity: 'Media',
        userId: req.user?.userId,
        metadata: { url: fileUrl, isCloud, originalName: req.file.originalname, size: req.file.size, ip: req.ip },
      });

      res.status(201).json({
        status: 'success',
        message: 'Asset uploaded successfully',
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          isCloud,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const mediaController = new MediaController();
