'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getRoutes(search?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    isActive?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      code?: { contains: string; mode: 'insensitive' };
    }>;
  } = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const routes = await db.route.findMany({
    where,
    orderBy: { code: 'asc' },
    include: {
      factory: { select: { id: true, name: true, code: true } },
      customer: { select: { id: true, companyName: true, shortName: true } },
      _count: {
        select: { trips: true },
      },
    },
  });

  // Calculate usage stats for each route
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const routesWithStats = await Promise.all(
    routes.map(async (route) => {
      const monthlyTrips = await db.trip.count({
        where: {
          routeId: route.id,
          tripDate: { gte: startOfMonth },
        },
      });

      const monthlyStats = await db.trip.aggregate({
        where: {
          routeId: route.id,
          tripDate: { gte: startOfMonth },
        },
        _sum: { quantity: true, actualFuel: true, actualDriverPay: true },
      });

      return {
        ...route,
        totalTrips: route._count.trips,
        monthlyTrips,
        monthlyQuantity: Number(monthlyStats._sum.quantity || 0),
        monthlyFuel: Number(monthlyStats._sum.actualFuel || 0),
        monthlyDriverPay: Number(monthlyStats._sum.actualDriverPay || 0),
      };
    })
  );

  return routesWithStats;
}

export async function getRoute(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const route = await db.route.findUnique({
    where: { id },
    include: {
      factory: true,
      customer: true,
      trips: {
        orderBy: { tripDate: 'desc' },
        take: 50,
        include: {
          vehicle: { select: { plateNumber: true } },
          driver: { select: { name: true } },
          cementType: { select: { code: true } },
        },
      },
    },
  });

  return route;
}
