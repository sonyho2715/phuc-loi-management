'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getFuelTransactions(
  search?: string,
  vehicleId?: string,
  stationId?: string,
  dateFrom?: string,
  dateTo?: string
) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    vehicleId?: string;
    fuelStationId?: string;
    transactionDate?: { gte?: Date; lte?: Date };
    OR?: Array<{
      vehicle?: { plateNumber: { contains: string; mode: 'insensitive' } };
    }>;
  } = {};

  if (vehicleId) where.vehicleId = vehicleId;
  if (stationId) where.fuelStationId = stationId;

  if (dateFrom || dateTo) {
    where.transactionDate = {};
    if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
    if (dateTo) where.transactionDate.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const transactions = await db.fuelTransaction.findMany({
    where,
    orderBy: { transactionDate: 'desc' },
    take: 100,
    include: {
      vehicle: { select: { id: true, plateNumber: true } },
      fuelStation: { select: { id: true, name: true } },
      trip: { select: { tripCode: true } },
    },
  });

  return transactions;
}

export async function getFuelStats() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyStats = await db.fuelTransaction.aggregate({
    where: {
      transactionDate: { gte: startOfMonth },
    },
    _sum: { liters: true, totalAmount: true, overLimit: true },
    _count: true,
  });

  const overageCount = await db.fuelTransaction.count({
    where: {
      transactionDate: { gte: startOfMonth },
      isWithinLimit: false,
    },
  });

  // Get fuel by vehicle
  const fuelByVehicle = await db.fuelTransaction.groupBy({
    by: ['vehicleId'],
    where: {
      transactionDate: { gte: startOfMonth },
    },
    _sum: { liters: true, totalAmount: true },
    _count: true,
  });

  const vehicleIds = fuelByVehicle.map(f => f.vehicleId);
  const vehicles = await db.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: { id: true, plateNumber: true },
  });

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  return {
    totalLiters: Number(monthlyStats._sum.liters || 0),
    totalAmount: Number(monthlyStats._sum.totalAmount || 0),
    totalOverage: Number(monthlyStats._sum.overLimit || 0),
    transactionCount: monthlyStats._count,
    overageCount,
    fuelByVehicle: fuelByVehicle.map(f => ({
      vehicleId: f.vehicleId,
      plateNumber: vehicleMap.get(f.vehicleId)?.plateNumber || 'N/A',
      liters: Number(f._sum.liters || 0),
      amount: Number(f._sum.totalAmount || 0),
      count: f._count,
    })).sort((a, b) => b.liters - a.liters),
  };
}

export async function getFuelStations() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  return db.fuelStation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createFuelTransaction(data: {
  vehicleId: string;
  fuelStationId: string;
  tripId?: string;
  liters: number;
  pricePerLiter: number;
  paymentMethod: 'COMPANY_ACCOUNT' | 'CASH' | 'DRIVER_ADVANCE';
  reference?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const totalAmount = data.liters * data.pricePerLiter;

    // Check against route fuel allowance if trip is linked
    let isWithinLimit = true;
    let overLimit = null;

    if (data.tripId) {
      const trip = await db.trip.findUnique({
        where: { id: data.tripId },
        include: { route: true },
      });

      if (trip?.route?.fuelAllowance) {
        const allowance = Number(trip.route.fuelAllowance);
        if (data.liters > allowance) {
          isWithinLimit = false;
          overLimit = data.liters - allowance;
        }
      }
    }

    const transaction = await db.fuelTransaction.create({
      data: {
        transactionDate: new Date(),
        vehicleId: data.vehicleId,
        fuelStationId: data.fuelStationId,
        tripId: data.tripId,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
        totalAmount,
        isWithinLimit,
        overLimit,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
    });

    // Create alert if over limit
    if (!isWithinLimit && overLimit) {
      const vehicle = await db.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: { plateNumber: true },
      });

      await db.alert.create({
        data: {
          alertType: 'FUEL_OVERAGE',
          severity: overLimit > 10 ? 'HIGH' : 'MEDIUM',
          title: 'Vượt định mức dầu',
          message: `Xe ${vehicle?.plateNumber} đổ vượt định mức ${overLimit.toFixed(1)} lít`,
          entityType: 'Vehicle',
          entityId: data.vehicleId,
        },
      });
    }

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'FuelTransaction',
        entityId: transaction.id,
        details: { vehicleId: data.vehicleId, liters: data.liters },
      },
    });

    revalidatePath('/fuel');
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Create fuel transaction error:', error);
    return { success: false, error: 'Không thể ghi nhận đổ dầu' };
  }
}
