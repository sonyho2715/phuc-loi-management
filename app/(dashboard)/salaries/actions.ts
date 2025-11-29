'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getDriverSalaries(month?: number, year?: number) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();

  // Get all active drivers
  const drivers = await db.driver.findMany({
    where: { isActive: true, status: 'ACTIVE' },
    orderBy: { code: 'asc' },
  });

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // Calculate salary for each driver
  const salaries = await Promise.all(
    drivers.map(async (driver) => {
      // Get existing salary record
      const existingSalary = await db.driverSalary.findUnique({
        where: {
          driverId_month_year: {
            driverId: driver.id,
            month: targetMonth,
            year: targetYear,
          },
        },
      });

      // Calculate from trips
      const tripStats = await db.trip.aggregate({
        where: {
          driverId: driver.id,
          tripDate: { gte: startOfMonth, lte: endOfMonth },
          status: 'DELIVERED',
        },
        _sum: { actualDriverPay: true, actualMeal: true },
        _count: true,
      });

      // Calculate fuel overage
      const fuelOverage = await db.fuelTransaction.aggregate({
        where: {
          vehicle: { driverId: driver.id },
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
          isWithinLimit: false,
        },
        _sum: { overLimit: true },
      });

      // Get advances
      const advances = await db.driverAdvance.aggregate({
        where: {
          driverId: driver.id,
          advanceDate: { gte: startOfMonth, lte: endOfMonth },
          status: 'APPROVED',
        },
        _sum: { amount: true },
      });

      const baseSalary = Number(driver.baseSalary || 0);
      const tripBonus = Number(tripStats._sum.actualDriverPay || 0);
      const mealAllowance = Number(tripStats._sum.actualMeal || 0);
      const fuelOverageDeduction = Number(fuelOverage._sum.overLimit || 0) * 24500; // Current fuel price
      const advanceDeduction = Number(advances._sum.amount || 0);

      const grossSalary = baseSalary + tripBonus + mealAllowance;
      const netSalary = grossSalary - fuelOverageDeduction - advanceDeduction;

      return {
        driverId: driver.id,
        driverCode: driver.code,
        driverName: driver.name,
        month: targetMonth,
        year: targetYear,
        baseSalary,
        tripBonus,
        mealAllowance,
        tripCount: tripStats._count,
        fuelOverage: Number(fuelOverage._sum.overLimit || 0),
        fuelOverageDeduction,
        advances: advanceDeduction,
        grossSalary,
        netSalary,
        status: existingSalary?.status || 'DRAFT',
        paidDate: existingSalary?.paidDate,
      };
    })
  );

  return salaries;
}

export async function calculateAndSaveSalary(driverId: string, month: number, year: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return { success: false, error: 'Không tìm thấy lái xe' };
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Calculate from trips
    const tripStats = await db.trip.aggregate({
      where: {
        driverId,
        tripDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'DELIVERED',
      },
      _sum: { actualDriverPay: true, actualMeal: true },
      _count: true,
    });

    // Calculate fuel overage
    const fuelOverage = await db.fuelTransaction.aggregate({
      where: {
        vehicle: { driverId },
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
        isWithinLimit: false,
      },
      _sum: { overLimit: true },
    });

    // Get advances
    const advances = await db.driverAdvance.aggregate({
      where: {
        driverId,
        advanceDate: { gte: startOfMonth, lte: endOfMonth },
        status: 'APPROVED',
      },
      _sum: { amount: true },
    });

    const baseSalary = Number(driver.baseSalary || 0);
    const tripBonus = Number(tripStats._sum.actualDriverPay || 0);
    const mealAllowance = Number(tripStats._sum.actualMeal || 0);
    const fuelOverageAmount = Number(fuelOverage._sum.overLimit || 0) * 24500;
    const advanceAmount = Number(advances._sum.amount || 0);

    const grossSalary = baseSalary + tripBonus + mealAllowance;
    const netSalary = grossSalary - fuelOverageAmount - advanceAmount;

    const salary = await db.driverSalary.upsert({
      where: {
        driverId_month_year: { driverId, month, year },
      },
      update: {
        baseSalary,
        tripBonus,
        mealAllowance,
        fuelOverage: fuelOverageAmount,
        advances: advanceAmount,
        grossSalary,
        netSalary,
        tripCount: tripStats._count,
        status: 'DRAFT',
      },
      create: {
        driverId,
        month,
        year,
        baseSalary,
        tripBonus,
        mealAllowance,
        fuelOverage: fuelOverageAmount,
        advances: advanceAmount,
        grossSalary,
        netSalary,
        tripCount: tripStats._count,
        status: 'DRAFT',
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'DriverSalary',
        entityId: salary.id,
        details: { driverId, month, year, netSalary },
      },
    });

    revalidatePath('/salaries');
    return { success: true, data: salary };
  } catch (error) {
    console.error('Calculate salary error:', error);
    return { success: false, error: 'Không thể tính lương' };
  }
}
