import { prisma } from '../../lib/prisma';

export interface AuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  metadata?: any;
}

export const logAction = async (params: AuditLogParams) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        userId: params.userId || null,
        metadata: params.metadata || {},
      },
    });
    return log;
  } catch (err) {
    console.error('Failed to register action audit log:', (err as Error).message);
    return null;
  }
};

export const fetchAuditLogs = async (limit = 100, skip = 0) => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: skip,
  });
};
