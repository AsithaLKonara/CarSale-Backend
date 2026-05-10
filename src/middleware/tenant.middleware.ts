import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Organization } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      organization?: Organization;
    }
  }
}

/**
 * Resolves active dealership Organization context based on headers, subdomains, or authenticated user claims.
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let orgSlug = req.headers['x-organization-slug'] as string;
    let orgId = req.headers['x-organization-id'] as string;

    // 1. Fallback: Parse org slug from hostname subdomain (e.g. lamborghini.ultradrive.com)
    if (!orgSlug && !orgId && req.hostname) {
      const parts = req.hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        orgSlug = parts[0];
      }
    }

    // 2. Fallback: Parse from authenticated user claims
    if (!orgId && !orgSlug && req.user?.organizationId) {
      orgId = req.user.organizationId;
    }

    let organization: Organization | null = null;

    if (orgId) {
      organization = await prisma.organization.findUnique({ where: { id: orgId } });
    } else if (orgSlug) {
      organization = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    } else {
      // Direct default fallback to main tenant to prevent breakage on initial launch
      organization = await prisma.organization.findUnique({ where: { slug: 'ultradrive-hq' } });
    }

    if (!organization) {
      const error: any = new Error('Dealership tenant context is invalid or missing');
      error.statusCode = 404;
      error.name = 'NotFoundError';
      throw error;
    }

    // If authenticated, prevent unauthorized cross-tenant data requests
    if (req.user?.organizationId && req.user.organizationId !== organization.id && req.user.role !== 'admin') {
      const error: any = new Error('Access denied. Cross-tenant request unauthorized for this account context');
      error.statusCode = 403;
      error.name = 'ForbiddenError';
      throw error;
    }

    // Bind resolved tenant context to active Express Request stream
    req.organization = organization;
    next();
  } catch (error) {
    next(error);
  }
};
