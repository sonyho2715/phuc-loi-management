'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getTrips(
  search?: string,
  status?: string,
  dateFrom?: string,
  dateTo?: string
) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const where: {
    status?: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    tripDate?: { gte?: Date; lte?: Date };
    OR?: Array<{
      tripCode?: { contains: string; mode: 'insensitive' };
      vehicle?: { plateNumber: { contains: string; mode: 'insensitive' } };
      driver?: { name: { contains: string; mode: 'insensitive' } };
    }>;
  } = {};

  if (status && status !== 'all') {
    where.status = status as 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  }

  if (dateFrom || dateTo) {
    where.tripDate = {};
    if (dateFrom) where.tripDate.gte = new Date(dateFrom);
    if (dateTo) where.tripDate.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { tripCode: { contains: search, mode: 'insensitive' } },
      { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
      { driver: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const trips = await db.trip.findMany({
    where,
    orderBy: { tripDate: 'desc' },
    take: 100,
    include: {
      vehicle: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, name: true, code: true } },
      route: {
        select: {
          id: true,
          name: true,
          code: true,
          fuelAllowance: true,
          driverPay: true,
          factory: { select: { name: true } },
          customer: { select: { shortName: true, companyName: true } },
        },
      },
      cementType: { select: { code: true, name: true } },
    },
  });

  return trips.map((trip) => ({
    ...trip,
    fuelVariance: trip.actualFuel && trip.route?.fuelAllowance
      ? Number(trip.actualFuel) - Number(trip.route.fuelAllowance)
      : null,
  }));
}

export async function getDispatchData() {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const [vehicles, drivers, routes, cementTypes] = await Promise.all([
      db.vehicle.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { plateNumber: 'asc' },
        include: {
          driver: { select: { id: true, name: true } },
        },
      }),
      db.driver.findMany({
        where: { status: 'ACTIVE', isActive: true },
        orderBy: { code: 'asc' },
      }),
      db.route.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      db.cementType.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        vehicles: vehicles.map(v => ({
          id: v.id,
          plateNumber: v.plateNumber,
          vehicleType: v.vehicleType,
          capacity: Number(v.capacity),
          driver: v.driver,
        })),
        drivers: drivers.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          phone: d.phone,
        })),
        routes: routes.map(r => ({
          id: r.id,
          code: r.code,
          name: r.name,
          fromAddress: r.fromAddress,
          toAddress: r.toAddress,
          distance: Number(r.distance),
          fuelAllowance: Number(r.fuelAllowance),
          driverPay: Number(r.driverPay),
          mealAllowance: Number(r.mealAllowance),
          tollFee: Number(r.tollFee),
        })),
        cementTypes: cementTypes.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
        })),
      },
    };
  } catch (error) {
    console.error('Get dispatch data error:', error);
    return { success: false, error: 'Không thể tải dữ liệu' };
  }
}

export async function createTrip(data: {
  vehicleId: string;
  driverId: string;
  routeId: string;
  cementTypeId: string;
  quantity: number;
  deliveryNote?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Generate trip code
    const today = new Date();
    const prefix = `TR-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    const lastTrip = await db.trip.findFirst({
      where: { tripCode: { startsWith: prefix } },
      orderBy: { tripCode: 'desc' },
    });

    let sequence = 1;
    if (lastTrip) {
      const lastSequence = parseInt(lastTrip.tripCode.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    const tripCode = `${prefix}-${sequence.toString().padStart(4, '0')}`;

    // Get route to copy default costs
    const route = await db.route.findUnique({ where: { id: data.routeId } });

    const trip = await db.trip.create({
      data: {
        tripCode,
        tripDate: today,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        routeId: data.routeId,
        cementTypeId: data.cementTypeId,
        quantity: data.quantity,
        deliveryNote: data.deliveryNote,
        notes: data.notes,
        actualDriverPay: route?.driverPay,
        actualMeal: route?.mealAllowance,
        actualToll: route?.tollFee,
        status: 'PENDING',
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Trip',
        entityId: trip.id,
        details: { tripCode },
      },
    });

    revalidatePath('/trips');
    return { success: true, data: trip };
  } catch (error) {
    console.error('Create trip error:', error);
    return { success: false, error: 'Không thể tạo chuyến hàng' };
  }
}

export async function updateTripStatus(id: string, status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED') {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const updateData: {
      status: typeof status;
      departureTime?: Date;
      arrivalTime?: Date;
    } = { status };

    if (status === 'IN_TRANSIT') {
      updateData.departureTime = new Date();
    } else if (status === 'DELIVERED') {
      updateData.arrivalTime = new Date();
    }

    const trip = await db.trip.update({
      where: { id },
      data: updateData,
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Trip',
        entityId: trip.id,
        details: { tripCode: trip.tripCode, status },
      },
    });

    revalidatePath('/trips');
    return { success: true, data: trip };
  } catch (error) {
    console.error('Update trip status error:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}

export async function recordTripFuel(tripId: string, actualFuel: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const trip = await db.trip.update({
      where: { id: tripId },
      data: { actualFuel },
      include: { route: true },
    });

    // Check if fuel exceeds allowance and create alert
    if (trip.route && actualFuel > Number(trip.route.fuelAllowance)) {
      const overage = actualFuel - Number(trip.route.fuelAllowance);
      await db.alert.create({
        data: {
          alertType: 'FUEL_OVERAGE',
          severity: overage > 10 ? 'HIGH' : 'MEDIUM',
          title: 'Vượt định mức dầu',
          message: `Chuyến ${trip.tripCode} vượt định mức ${overage.toFixed(1)} lít`,
          entityType: 'Trip',
          entityId: trip.id,
        },
      });
    }

    revalidatePath('/trips');
    return { success: true, data: trip };
  } catch (error) {
    console.error('Record fuel error:', error);
    return { success: false, error: 'Không thể ghi nhận dầu' };
  }
}
