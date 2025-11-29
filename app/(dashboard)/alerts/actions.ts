'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getAlerts(type?: string, resolved?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    alertType?: 'FUEL_OVERAGE' | 'PAYMENT_OVERDUE' | 'LICENSE_EXPIRY' | 'VEHICLE_MAINTENANCE' | 'LOW_INVENTORY' | 'GOAL_WARNING';
    isResolved?: boolean;
  } = {};

  if (type && type !== 'all') {
    where.alertType = type as 'FUEL_OVERAGE' | 'PAYMENT_OVERDUE' | 'LICENSE_EXPIRY' | 'VEHICLE_MAINTENANCE' | 'LOW_INVENTORY' | 'GOAL_WARNING';
  }

  if (resolved === 'true') {
    where.isResolved = true;
  } else if (resolved === 'false') {
    where.isResolved = false;
  }

  const alerts = await db.alert.findMany({
    where,
    orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return alerts;
}

export async function getAlertStats() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const stats = await db.alert.groupBy({
    by: ['alertType', 'isResolved'],
    _count: true,
  });

  const unresolvedByType: Record<string, number> = {};
  let totalUnresolved = 0;
  let totalResolved = 0;

  stats.forEach((stat) => {
    if (!stat.isResolved) {
      unresolvedByType[stat.alertType] = (unresolvedByType[stat.alertType] || 0) + stat._count;
      totalUnresolved += stat._count;
    } else {
      totalResolved += stat._count;
    }
  });

  const criticalCount = await db.alert.count({
    where: {
      isResolved: false,
      severity: 'CRITICAL',
    },
  });

  const highCount = await db.alert.count({
    where: {
      isResolved: false,
      severity: 'HIGH',
    },
  });

  return {
    totalUnresolved,
    totalResolved,
    criticalCount,
    highCount,
    unresolvedByType,
  };
}

export async function resolveAlert(id: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const alert = await db.alert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: session.user.name,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Alert',
        entityId: alert.id,
        details: { action: 'resolved' },
      },
    });

    revalidatePath('/alerts');
    return { success: true, data: alert };
  } catch (error) {
    console.error('Resolve alert error:', error);
    return { success: false, error: 'Không thể xử lý cảnh báo' };
  }
}

export async function markAlertRead(id: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const alert = await db.alert.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath('/alerts');
    return { success: true, data: alert };
  } catch (error) {
    console.error('Mark read error:', error);
    return { success: false, error: 'Không thể đánh dấu đã đọc' };
  }
}
