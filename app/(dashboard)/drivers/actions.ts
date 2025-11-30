'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getDrivers(search?: string, status?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    isActive?: boolean;
    status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      code?: { contains: string; mode: 'insensitive' };
      phone?: { contains: string; mode: 'insensitive' };
    }>;
  } = { isActive: true };

  if (status && status !== 'all') {
    where.status = status as 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const drivers = await db.driver.findMany({
    where,
    orderBy: { code: 'asc' },
    include: {
      vehicles: {
        select: { id: true, plateNumber: true },
      },
      trips: {
        orderBy: { tripDate: 'desc' },
        take: 1,
        select: { tripDate: true },
      },
      _count: {
        select: { trips: true },
      },
    },
  });

  // Calculate monthly stats for each driver
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const driversWithStats = await Promise.all(
    drivers.map(async (driver) => {
      const monthlyStats = await db.trip.aggregate({
        where: {
          driverId: driver.id,
          tripDate: { gte: startOfMonth },
        },
        _sum: { actualDriverPay: true, actualMeal: true },
        _count: true,
      });

      const monthlyAdvances = await db.driverAdvance.aggregate({
        where: {
          driverId: driver.id,
          advanceDate: { gte: startOfMonth },
          status: 'APPROVED',
        },
        _sum: { amount: true },
      });

      return {
        ...driver,
        lastTripDate: driver.trips[0]?.tripDate || null,
        totalTrips: driver._count.trips,
        monthlyTrips: monthlyStats._count,
        monthlyEarnings: Number(monthlyStats._sum.actualDriverPay || 0) + Number(monthlyStats._sum.actualMeal || 0),
        monthlyAdvances: Number(monthlyAdvances._sum.amount || 0),
      };
    })
  );

  return driversWithStats;
}

export async function getDriver(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const driver = await db.driver.findUnique({
    where: { id },
    include: {
      vehicles: true,
      trips: {
        orderBy: { tripDate: 'desc' },
        take: 30,
        include: {
          route: { select: { name: true, code: true, driverPay: true } },
          vehicle: { select: { plateNumber: true } },
        },
      },
      salaries: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      },
      advances: {
        orderBy: { advanceDate: 'desc' },
        take: 20,
      },
    },
  });

  if (!driver) return null;

  // Calculate current month earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyStats = await db.trip.aggregate({
    where: {
      driverId: id,
      tripDate: { gte: startOfMonth },
    },
    _sum: { actualDriverPay: true, actualMeal: true, actualFuel: true },
    _count: true,
  });

  // Get fuel overage
  const fuelOverage = await db.fuelTransaction.aggregate({
    where: {
      vehicle: { driverId: id },
      transactionDate: { gte: startOfMonth },
      isWithinLimit: false,
    },
    _sum: { overLimit: true },
  });

  return {
    ...driver,
    monthlyTrips: monthlyStats._count,
    monthlyDriverPay: Number(monthlyStats._sum.actualDriverPay || 0),
    monthlyMeal: Number(monthlyStats._sum.actualMeal || 0),
    monthlyFuelUsed: Number(monthlyStats._sum.actualFuel || 0),
    monthlyFuelOverage: Number(fuelOverage._sum.overLimit || 0),
  };
}

export async function createAdvance(driverId: string, amount: number, reason: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const advance = await db.driverAdvance.create({
      data: {
        driverId,
        amount,
        reason,
        advanceDate: new Date(),
        status: 'PENDING',
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'DriverAdvance',
        entityId: advance.id,
        details: { driverId, amount },
      },
    });

    revalidatePath(`/drivers/${driverId}`);
    return { success: true, data: advance };
  } catch (error) {
    console.error('Create advance error:', error);
    return { success: false, error: 'Không thể tạo ứng lương' };
  }
}

export async function approveAdvance(advanceId: string, approved: boolean) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const advance = await db.driverAdvance.update({
      where: { id: advanceId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedBy: session.user.name,
        approvedDate: new Date(),
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'DriverAdvance',
        entityId: advance.id,
        details: { status: approved ? 'APPROVED' : 'REJECTED' },
      },
    });

    revalidatePath('/drivers');
    return { success: true, data: advance };
  } catch (error) {
    console.error('Approve advance error:', error);
    return { success: false, error: 'Không thể duyệt ứng lương' };
  }
}

export async function createDriver(data: {
  code: string;
  name: string;
  phone?: string;
  idNumber?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  bankAccount?: string;
  bankName?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Check for duplicate code
    const existing = await db.driver.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return { success: false, error: 'Mã lái xe đã tồn tại' };
    }

    const driver = await db.driver.create({
      data: {
        code: data.code,
        name: data.name,
        phone: data.phone || null,
        idNumber: data.idNumber || null,
        address: data.address || null,
        licenseNumber: data.licenseNumber || null,
        licenseExpiry: data.licenseExpiry || null,
        bankAccount: data.bankAccount || null,
        bankName: data.bankName || null,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Driver',
        entityId: driver.id,
        details: { code: driver.code, name: driver.name },
      },
    });

    revalidatePath('/drivers');
    return { success: true, data: driver };
  } catch (error) {
    console.error('Create driver error:', error);
    return { success: false, error: 'Không thể tạo lái xe' };
  }
}

export async function updateDriver(id: string, data: {
  code?: string;
  name?: string;
  phone?: string;
  idNumber?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: Date | null;
  bankAccount?: string;
  bankName?: string;
  baseSalary?: number;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const driver = await db.driver.update({
      where: { id },
      data: {
        ...data,
        licenseExpiry: data.licenseExpiry === null ? null : data.licenseExpiry,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Driver',
        entityId: driver.id,
        details: { code: driver.code, name: driver.name },
      },
    });

    revalidatePath('/drivers');
    revalidatePath(`/drivers/${id}`);
    return { success: true, data: driver };
  } catch (error) {
    console.error('Update driver error:', error);
    return { success: false, error: 'Không thể cập nhật lái xe' };
  }
}

export async function updateDriverStatus(id: string, status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED') {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const driver = await db.driver.update({
      where: { id },
      data: { status },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Driver',
        entityId: driver.id,
        details: { code: driver.code, status },
      },
    });

    revalidatePath('/drivers');
    return { success: true, data: driver };
  } catch (error) {
    console.error('Update driver status error:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}
