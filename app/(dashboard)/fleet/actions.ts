'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getFleetOverview() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get vehicle status counts
    const vehicleStats = await db.vehicle.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: true,
    });

    const vehicleStatusMap: Record<string, number> = {
      ACTIVE: 0,
      MAINTENANCE: 0,
      BROKEN: 0,
      RETIRED: 0,
    };
    vehicleStats.forEach((v) => {
      vehicleStatusMap[v.status] = v._count;
    });

    // Get today's trips
    const todayTrips = await db.trip.findMany({
      where: {
        tripDate: { gte: today, lt: tomorrow },
      },
      include: {
        vehicle: { select: { plateNumber: true } },
        driver: { select: { name: true, code: true } },
        route: { select: { name: true, code: true } },
        cementType: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get trip status counts for today
    const tripStatusCounts = {
      pending: todayTrips.filter((t) => t.status === 'PENDING').length,
      inTransit: todayTrips.filter((t) => t.status === 'IN_TRANSIT').length,
      delivered: todayTrips.filter((t) => t.status === 'DELIVERED').length,
      cancelled: todayTrips.filter((t) => t.status === 'CANCELLED').length,
    };

    // Get vehicles currently in transit
    const vehiclesInTransit = await db.trip.findMany({
      where: {
        status: 'IN_TRANSIT',
      },
      include: {
        vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
        driver: { select: { name: true, phone: true } },
        route: { select: { name: true, distance: true } },
      },
    });

    // Get available vehicles (active but not on trip)
    const inTransitVehicleIds = vehiclesInTransit.map((t) => t.vehicleId);
    const availableVehicles = await db.vehicle.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        ...(inTransitVehicleIds.length > 0 ? { id: { notIn: inTransitVehicleIds } } : {}),
      },
      include: {
        driver: { select: { name: true } },
      },
      take: 10,
    });

    // Get recent alerts
    const recentAlerts = await db.alert.findMany({
      where: {
        isResolved: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get today's fuel transactions
    const todayFuel = await db.fuelTransaction.aggregate({
      where: {
        transactionDate: { gte: today, lt: tomorrow },
      },
      _sum: { liters: true, totalAmount: true },
      _count: true,
    });

    // Get drivers on duty today
    const driversOnDuty = await db.trip.groupBy({
      by: ['driverId'],
      where: {
        tripDate: { gte: today, lt: tomorrow },
      },
    });

    // Get total active drivers
    const totalDrivers = await db.driver.count({
      where: { status: 'ACTIVE', isActive: true },
    });

    return {
      vehicles: {
        total: Object.values(vehicleStatusMap).reduce((a, b) => a + b, 0),
        active: vehicleStatusMap.ACTIVE,
        maintenance: vehicleStatusMap.MAINTENANCE,
        broken: vehicleStatusMap.BROKEN,
        inTransit: vehiclesInTransit.length,
        available: availableVehicles.length,
      },
      trips: {
        today: todayTrips.length,
        ...tripStatusCounts,
      },
      drivers: {
        total: totalDrivers,
        onDuty: driversOnDuty.length,
        available: totalDrivers - driversOnDuty.length,
      },
      fuel: {
        todayLiters: Number(todayFuel._sum.liters || 0),
        todayAmount: Number(todayFuel._sum.totalAmount || 0),
        transactions: todayFuel._count,
      },
      vehiclesInTransit: vehiclesInTransit.map((t) => ({
        tripId: t.id,
        tripCode: t.tripCode,
        vehicle: t.vehicle,
        driver: t.driver,
        route: t.route,
        startTime: t.createdAt,
      })),
      availableVehicles: availableVehicles.map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        vehicleType: v.vehicleType,
        driver: v.driver?.name || null,
      })),
      todayTrips: todayTrips.map((t) => ({
        id: t.id,
        tripCode: t.tripCode,
        status: t.status,
        vehicle: t.vehicle?.plateNumber,
        driver: t.driver?.name,
        route: t.route?.name,
        quantity: Number(t.quantity),
        cementType: t.cementType?.code,
      })),
      recentAlerts,
    };
  } catch (error) {
    console.error('Fleet overview error:', error);
    // Return empty data instead of throwing
    return {
      vehicles: { total: 0, active: 0, maintenance: 0, broken: 0, inTransit: 0, available: 0 },
      trips: { today: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 },
      drivers: { total: 0, onDuty: 0, available: 0 },
      fuel: { todayLiters: 0, todayAmount: 0, transactions: 0 },
      vehiclesInTransit: [],
      availableVehicles: [],
      todayTrips: [],
      recentAlerts: [],
    };
  }
}

export async function getTripTimeline(days: number = 7) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trips = await db.trip.groupBy({
      by: ['tripDate'],
      where: {
        tripDate: { gte: startDate },
        status: 'DELIVERED',
      },
      _count: true,
      _sum: { quantity: true },
    });

    return trips.map((t) => ({
      date: t.tripDate,
      count: t._count,
      quantity: Number(t._sum.quantity || 0),
    }));
  } catch (error) {
    console.error('Trip timeline error:', error);
    return [];
  }
}
