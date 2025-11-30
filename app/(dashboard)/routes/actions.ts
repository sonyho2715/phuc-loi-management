'use server';

import { revalidatePath } from 'next/cache';
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

export async function getRouteFormData() {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const [factories, customers] = await Promise.all([
      db.factory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
      db.customer.findMany({
        where: { isActive: true },
        orderBy: { companyName: 'asc' },
        select: { id: true, companyName: true, shortName: true },
      }),
    ]);

    return {
      success: true,
      data: { factories, customers },
    };
  } catch (error) {
    console.error('Get route form data error:', error);
    return { success: false, error: 'Không thể tải dữ liệu' };
  }
}

export async function createRoute(data: {
  code: string;
  name: string;
  fromAddress?: string;
  toAddress?: string;
  distance?: number;
  fuelAllowance: number;
  driverPay: number;
  mealAllowance: number;
  tollFee: number;
  factoryId?: string;
  customerId?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Check for duplicate code
    const existing = await db.route.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return { success: false, error: 'Mã tuyến đường đã tồn tại' };
    }

    const route = await db.route.create({
      data: {
        code: data.code,
        name: data.name,
        fromAddress: data.fromAddress || null,
        toAddress: data.toAddress || null,
        distance: data.distance || null,
        fuelAllowance: data.fuelAllowance,
        driverPay: data.driverPay,
        mealAllowance: data.mealAllowance,
        tollFee: data.tollFee,
        factoryId: data.factoryId || null,
        customerId: data.customerId || null,
        isActive: true,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Route',
        entityId: route.id,
        details: { code: route.code, name: route.name },
      },
    });

    revalidatePath('/routes');
    return { success: true, data: route };
  } catch (error) {
    console.error('Create route error:', error);
    return { success: false, error: 'Không thể tạo tuyến đường' };
  }
}

export async function updateRoute(id: string, data: {
  code?: string;
  name?: string;
  fromAddress?: string;
  toAddress?: string;
  distance?: number;
  fuelAllowance?: number;
  driverPay?: number;
  mealAllowance?: number;
  tollFee?: number;
  factoryId?: string | null;
  customerId?: string | null;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const route = await db.route.update({
      where: { id },
      data,
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Route',
        entityId: route.id,
        details: { code: route.code, name: route.name },
      },
    });

    revalidatePath('/routes');
    revalidatePath(`/routes/${id}`);
    return { success: true, data: route };
  } catch (error) {
    console.error('Update route error:', error);
    return { success: false, error: 'Không thể cập nhật tuyến đường' };
  }
}

export async function calibrateRoute(id: string, costs: {
  fuelAllowance: number;
  driverPay: number;
  mealAllowance: number;
  tollFee: number;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const route = await db.route.update({
      where: { id },
      data: {
        fuelAllowance: costs.fuelAllowance,
        driverPay: costs.driverPay,
        mealAllowance: costs.mealAllowance,
        tollFee: costs.tollFee,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Route',
        entityId: route.id,
        details: {
          action: 'calibrate',
          fuelAllowance: costs.fuelAllowance,
          driverPay: costs.driverPay,
        },
      },
    });

    revalidatePath('/routes');
    return { success: true, data: route };
  } catch (error) {
    console.error('Calibrate route error:', error);
    return { success: false, error: 'Không thể cập nhật chi phí' };
  }
}
