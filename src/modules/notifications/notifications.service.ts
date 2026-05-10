import { prisma } from '../../lib/prisma';
import { broadcastToAdmins } from '../../socket';

export interface NotificationParams {
  title: string;
  message: string;
  type: 'booking' | 'inventory' | 'alert';
  organizationId?: string;
}

export const createNotification = async (params: NotificationParams) => {
  try {
    const notice = await prisma.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type,
        isRead: false,
        organizationId: params.organizationId,
      },
    });

    // Fire live socket notification to all active operations personnel
    broadcastToAdmins('notification:created', notice);

    return notice;
  } catch (err) {
    console.error('Failed to register notification alert:', (err as Error).message);
    return null;
  }
};

export const getNotificationsList = async (unreadOnly = false, limit = 50, skip = 0, organizationId?: string) => {
  const where: any = unreadOnly ? { isRead: false } : {};
  if (organizationId) {
    where.organizationId = organizationId;
  }
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: skip,
  });
};

export const markNotificationRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllNotificationsRead = async (organizationId?: string) => {
  const where: any = { isRead: false };
  if (organizationId) {
    where.organizationId = organizationId;
  }
  return prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });
};
