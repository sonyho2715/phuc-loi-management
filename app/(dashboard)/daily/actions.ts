'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getDailyData(dateString: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get reference data
  const [drivers, vehicles, routes, cementTypes] = await Promise.all([
    db.driver.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
    db.vehicle.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: { id: true, plateNumber: true, vehicleType: true },
      orderBy: { plateNumber: 'asc' },
    }),
    db.route.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, distance: true, driverPay: true, mealAllowance: true },
      orderBy: { code: 'asc' },
    }),
    db.cementType.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  // Get today's data
  const [trips, fuelTransactions, advances] = await Promise.all([
    db.trip.findMany({
      where: {
        tripDate: { gte: date, lt: nextDay },
      },
      include: {
        vehicle: { select: { plateNumber: true } },
        driver: { select: { name: true } },
        route: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.fuelTransaction.findMany({
      where: {
        transactionDate: { gte: date, lt: nextDay },
      },
      include: {
        vehicle: { select: { plateNumber: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.driverAdvance.findMany({
      where: {
        advanceDate: { gte: date, lt: nextDay },
      },
      include: {
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Calculate stats
  const stats = {
    tripCount: trips.length,
    totalQuantity: trips.reduce((sum, t) => sum + Number(t.quantity), 0),
    fuelLiters: fuelTransactions.reduce((sum, f) => sum + Number(f.liters), 0),
    fuelAmount: fuelTransactions.reduce((sum, f) => sum + Number(f.totalAmount), 0),
    advanceAmount: advances.reduce((sum, a) => sum + Number(a.amount), 0),
  };

  return {
    drivers: drivers.map(d => ({ id: d.id, code: d.code, name: d.name })),
    vehicles: vehicles.map(v => ({ id: v.id, plateNumber: v.plateNumber, vehicleType: v.vehicleType })),
    routes: routes.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      distance: Number(r.distance),
      driverPay: Number(r.driverPay),
      mealAllowance: Number(r.mealAllowance),
    })),
    cementTypes: cementTypes.map(c => ({ id: c.id, code: c.code, name: c.name })),
    trips: trips.map(t => ({
      id: t.id,
      tripCode: t.tripCode,
      status: t.status,
      vehicle: t.vehicle?.plateNumber || '',
      driver: t.driver?.name || '',
      route: t.route?.name || '',
      quantity: Number(t.quantity),
      createdAt: t.createdAt.toISOString(),
    })),
    fuelTransactions: fuelTransactions.map(f => ({
      id: f.id,
      vehicle: f.vehicle?.plateNumber || '',
      driver: f.driver?.name || '',
      liters: Number(f.liters),
      amount: Number(f.totalAmount),
      station: f.station || '',
      createdAt: f.createdAt.toISOString(),
    })),
    advances: advances.map(a => ({
      id: a.id,
      driver: a.driver?.name || '',
      amount: Number(a.amount),
      reason: a.reason || '',
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
    stats,
  };
}

export async function quickAddTrip(data: {
  vehicleId: string;
  driverId: string;
  routeId: string;
  cementTypeId?: string;
  quantity: number;
  tripDate: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get route info for pricing
    const route = await db.route.findUnique({ where: { id: data.routeId } });
    if (!route) {
      return { success: false, error: 'Không tìm thấy tuyến đường' };
    }

    // Generate trip code
    const today = new Date(data.tripDate);
    const tripCount = await db.trip.count({
      where: {
        tripDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const tripCode = `CH${dateStr}-${String(tripCount + 1).padStart(3, '0')}`;

    const trip = await db.trip.create({
      data: {
        tripCode,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        routeId: data.routeId,
        cementTypeId: data.cementTypeId || undefined,
        quantity: data.quantity,
        tripDate: new Date(data.tripDate),
        status: 'PENDING',
        driverPay: route.driverPay,
        mealAllowance: route.mealAllowance,
        actualDriverPay: route.driverPay,
        actualMeal: route.mealAllowance,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Trip',
        entityId: trip.id,
        details: { tripCode, vehicleId: data.vehicleId, driverId: data.driverId },
      },
    });

    revalidatePath('/daily');
    revalidatePath('/trips');
    revalidatePath('/fleet');
    return { success: true, data: trip };
  } catch (error) {
    console.error('Quick add trip error:', error);
    return { success: false, error: 'Không thể thêm chuyến hàng' };
  }
}

export async function quickAddFuel(data: {
  vehicleId: string;
  driverId?: string;
  liters: number;
  pricePerLiter: number;
  station?: string;
  odometerReading?: number;
  transactionDate: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const totalAmount = data.liters * data.pricePerLiter;

    // Check fuel limit for vehicle
    const vehicle = await db.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { fuelLimit: true },
    });

    const isWithinLimit = vehicle?.fuelLimit ? data.liters <= Number(vehicle.fuelLimit) : true;
    const overLimit = vehicle?.fuelLimit && !isWithinLimit
      ? data.liters - Number(vehicle.fuelLimit)
      : 0;

    const fuel = await db.fuelTransaction.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId || null,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
        totalAmount,
        station: data.station || null,
        odometerReading: data.odometerReading || null,
        transactionDate: new Date(data.transactionDate),
        isWithinLimit,
        overLimit,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'FuelTransaction',
        entityId: fuel.id,
        details: { vehicleId: data.vehicleId, liters: data.liters, totalAmount },
      },
    });

    revalidatePath('/daily');
    revalidatePath('/fuel');
    revalidatePath('/fleet');
    return { success: true, data: fuel };
  } catch (error) {
    console.error('Quick add fuel error:', error);
    return { success: false, error: 'Không thể thêm giao dịch nhiên liệu' };
  }
}

export async function quickAddAdvance(data: {
  driverId: string;
  amount: number;
  reason?: string;
  advanceDate: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const advance = await db.driverAdvance.create({
      data: {
        driverId: data.driverId,
        amount: data.amount,
        reason: data.reason || null,
        advanceDate: new Date(data.advanceDate),
        status: 'APPROVED', // Auto-approve for quick entry
        approvedBy: session.user.id,
        approvedDate: new Date(),
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'DriverAdvance',
        entityId: advance.id,
        details: { driverId: data.driverId, amount: data.amount },
      },
    });

    revalidatePath('/daily');
    revalidatePath('/drivers');
    revalidatePath('/salaries');
    return { success: true, data: advance };
  } catch (error) {
    console.error('Quick add advance error:', error);
    return { success: false, error: 'Không thể thêm ứng lương' };
  }
}

export async function updateTripStatus(tripId: string, status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED') {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const trip = await db.trip.update({
      where: { id: tripId },
      data: {
        status,
        ...(status === 'IN_TRANSIT' ? { departureTime: new Date() } : {}),
        ...(status === 'DELIVERED' ? { arrivalTime: new Date() } : {}),
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Trip',
        entityId: tripId,
        details: { status },
      },
    });

    revalidatePath('/daily');
    revalidatePath('/trips');
    revalidatePath('/fleet');
    return { success: true, data: trip };
  } catch (error) {
    console.error('Update trip status error:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}

export async function deleteTrip(tripId: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.trip.delete({ where: { id: tripId } });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'Trip',
        entityId: tripId,
        details: {},
      },
    });

    revalidatePath('/daily');
    revalidatePath('/trips');
    revalidatePath('/fleet');
    return { success: true };
  } catch (error) {
    console.error('Delete trip error:', error);
    return { success: false, error: 'Không thể xóa chuyến hàng' };
  }
}

export async function deleteFuelTransaction(fuelId: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.fuelTransaction.delete({ where: { id: fuelId } });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'FuelTransaction',
        entityId: fuelId,
        details: {},
      },
    });

    revalidatePath('/daily');
    revalidatePath('/fuel');
    return { success: true };
  } catch (error) {
    console.error('Delete fuel error:', error);
    return { success: false, error: 'Không thể xóa giao dịch' };
  }
}

// Get a single trip for editing
export async function getTrip(tripId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      vehicle: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, code: true, name: true } },
      route: { select: { id: true, code: true, name: true } },
      cementType: { select: { id: true, code: true, name: true } },
    },
  });

  if (!trip) throw new Error('Trip not found');

  return {
    id: trip.id,
    tripCode: trip.tripCode,
    tripDate: trip.tripDate.toISOString().split('T')[0],
    status: trip.status,
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    routeId: trip.routeId,
    cementTypeId: trip.cementTypeId,
    quantity: Number(trip.quantity),
    driverPay: Number(trip.driverPay || 0),
    mealAllowance: Number(trip.mealAllowance || 0),
    actualDriverPay: Number(trip.actualDriverPay || 0),
    actualMeal: Number(trip.actualMeal || 0),
    notes: trip.notes,
    vehicle: trip.vehicle,
    driver: trip.driver,
    route: trip.route,
    cementType: trip.cementType,
  };
}

// Update trip
export async function updateTrip(tripId: string, data: {
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
  cementTypeId?: string | null;
  quantity?: number;
  status?: string;
  driverPay?: number;
  mealAllowance?: number;
  actualDriverPay?: number;
  actualMeal?: number;
  notes?: string | null;
  tripDate?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (data.vehicleId) updateData.vehicleId = data.vehicleId;
    if (data.driverId) updateData.driverId = data.driverId;
    if (data.routeId) updateData.routeId = data.routeId;
    if (data.cementTypeId !== undefined) updateData.cementTypeId = data.cementTypeId || null;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.status) updateData.status = data.status;
    if (data.driverPay !== undefined) updateData.driverPay = data.driverPay;
    if (data.mealAllowance !== undefined) updateData.mealAllowance = data.mealAllowance;
    if (data.actualDriverPay !== undefined) updateData.actualDriverPay = data.actualDriverPay;
    if (data.actualMeal !== undefined) updateData.actualMeal = data.actualMeal;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.tripDate) updateData.tripDate = new Date(data.tripDate);

    const trip = await db.trip.update({
      where: { id: tripId },
      data: updateData,
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Trip',
        entityId: tripId,
        details: data,
      },
    });

    revalidatePath('/daily');
    revalidatePath('/trips');
    revalidatePath('/fleet');
    revalidatePath(`/trips/${tripId}`);
    return { success: true, data: trip };
  } catch (error) {
    console.error('Update trip error:', error);
    return { success: false, error: 'Không thể cập nhật chuyến hàng' };
  }
}

// Get fuel transaction for editing
export async function getFuelTransaction(fuelId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const fuel = await db.fuelTransaction.findUnique({
    where: { id: fuelId },
    include: {
      vehicle: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, code: true, name: true } },
    },
  });

  if (!fuel) throw new Error('Fuel transaction not found');

  return {
    id: fuel.id,
    transactionDate: fuel.transactionDate.toISOString().split('T')[0],
    vehicleId: fuel.vehicleId,
    driverId: fuel.driverId,
    liters: Number(fuel.liters),
    pricePerLiter: Number(fuel.pricePerLiter),
    totalAmount: Number(fuel.totalAmount),
    station: fuel.station,
    odometerReading: fuel.odometerReading,
    vehicle: fuel.vehicle,
    driver: fuel.driver,
  };
}

// Update fuel transaction
export async function updateFuelTransaction(fuelId: string, data: {
  vehicleId?: string;
  driverId?: string | null;
  liters?: number;
  pricePerLiter?: number;
  station?: string | null;
  odometerReading?: number | null;
  transactionDate?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (data.vehicleId) updateData.vehicleId = data.vehicleId;
    if (data.driverId !== undefined) updateData.driverId = data.driverId || null;
    if (data.liters !== undefined) updateData.liters = data.liters;
    if (data.pricePerLiter !== undefined) updateData.pricePerLiter = data.pricePerLiter;
    if (data.station !== undefined) updateData.station = data.station || null;
    if (data.odometerReading !== undefined) updateData.odometerReading = data.odometerReading || null;
    if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);

    // Recalculate total if liters or price changed
    if (data.liters !== undefined || data.pricePerLiter !== undefined) {
      const existing = await db.fuelTransaction.findUnique({ where: { id: fuelId } });
      const liters = data.liters ?? Number(existing?.liters);
      const price = data.pricePerLiter ?? Number(existing?.pricePerLiter);
      updateData.totalAmount = liters * price;
    }

    const fuel = await db.fuelTransaction.update({
      where: { id: fuelId },
      data: updateData,
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'FuelTransaction',
        entityId: fuelId,
        details: data,
      },
    });

    revalidatePath('/daily');
    revalidatePath('/fuel');
    return { success: true, data: fuel };
  } catch (error) {
    console.error('Update fuel error:', error);
    return { success: false, error: 'Không thể cập nhật giao dịch' };
  }
}
