'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getVehicles(search?: string, status?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    isActive?: boolean;
    status?: 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';
    OR?: Array<{
      plateNumber?: { contains: string; mode: 'insensitive' };
      brand?: { contains: string; mode: 'insensitive' };
    }>;
  } = { isActive: true };

  if (status && status !== 'all') {
    where.status = status as 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';
  }

  if (search) {
    where.OR = [
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const vehicles = await db.vehicle.findMany({
    where,
    orderBy: { plateNumber: 'asc' },
    include: {
      driver: {
        select: { id: true, name: true, phone: true },
      },
      trips: {
        orderBy: { tripDate: 'desc' },
        take: 1,
        select: { tripDate: true },
      },
      _count: {
        select: { trips: true, fuelTransactions: true },
      },
    },
  });

  // Calculate stats for each vehicle
  const vehiclesWithStats = await Promise.all(
    vehicles.map(async (vehicle) => {
      // Get this month's trip count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyTrips = await db.trip.count({
        where: {
          vehicleId: vehicle.id,
          tripDate: { gte: startOfMonth },
        },
      });

      // Get total fuel this month
      const monthlyFuel = await db.fuelTransaction.aggregate({
        where: {
          vehicleId: vehicle.id,
          transactionDate: { gte: startOfMonth },
        },
        _sum: { liters: true, totalAmount: true },
      });

      return {
        ...vehicle,
        lastTripDate: vehicle.trips[0]?.tripDate || null,
        tripCount: vehicle._count.trips,
        monthlyTrips,
        monthlyFuel: Number(monthlyFuel._sum.liters || 0),
        monthlyFuelCost: Number(monthlyFuel._sum.totalAmount || 0),
      };
    })
  );

  return vehiclesWithStats;
}

export async function getVehicle(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      driver: true,
      trips: {
        orderBy: { tripDate: 'desc' },
        take: 20,
        include: {
          route: { select: { name: true, code: true } },
          cementType: { select: { code: true, name: true } },
        },
      },
      fuelTransactions: {
        orderBy: { transactionDate: 'desc' },
        take: 20,
        include: {
          fuelStation: { select: { name: true } },
        },
      },
      expenses: {
        orderBy: { expenseDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!vehicle) return null;

  // Calculate totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyStats = await db.trip.aggregate({
    where: {
      vehicleId: id,
      tripDate: { gte: startOfMonth },
    },
    _sum: { quantity: true, actualFuel: true, actualDriverPay: true },
    _count: true,
  });

  const monthlyExpenses = await db.vehicleExpense.aggregate({
    where: {
      vehicleId: id,
      expenseDate: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  return {
    ...vehicle,
    monthlyTrips: monthlyStats._count,
    monthlyQuantity: Number(monthlyStats._sum.quantity || 0),
    monthlyFuel: Number(monthlyStats._sum.actualFuel || 0),
    monthlyDriverPay: Number(monthlyStats._sum.actualDriverPay || 0),
    monthlyExpenses: Number(monthlyExpenses._sum.amount || 0),
  };
}

export async function updateVehicleStatus(id: string, status: 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED') {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const vehicle = await db.vehicle.update({
      where: { id },
      data: { status },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Vehicle',
        entityId: vehicle.id,
        details: { plateNumber: vehicle.plateNumber, status },
      },
    });

    revalidatePath('/vehicles');
    return { success: true, data: vehicle };
  } catch (error) {
    console.error('Update vehicle status error:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái xe' };
  }
}

export async function assignDriver(vehicleId: string, driverId: string | null) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: { driverId },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Vehicle',
        entityId: vehicle.id,
        details: { plateNumber: vehicle.plateNumber, action: 'assign_driver', driverId },
      },
    });

    revalidatePath('/vehicles');
    return { success: true, data: vehicle };
  } catch (error) {
    console.error('Assign driver error:', error);
    return { success: false, error: 'Không thể gán lái xe' };
  }
}
