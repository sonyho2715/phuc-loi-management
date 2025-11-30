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

// Calculate salaries for all drivers in a month
export async function calculateAllSalaries(month: number, year: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const drivers = await db.driver.findMany({
      where: { isActive: true, status: 'ACTIVE' },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    let calculated = 0;
    for (const driver of drivers) {
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
      const fuelOverageAmount = Number(fuelOverage._sum.overLimit || 0) * 24500;
      const advanceAmount = Number(advances._sum.amount || 0);

      const grossSalary = baseSalary + tripBonus + mealAllowance;
      const netSalary = grossSalary - fuelOverageAmount - advanceAmount;

      await db.driverSalary.upsert({
        where: {
          driverId_month_year: { driverId: driver.id, month, year },
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
        },
        create: {
          driverId: driver.id,
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

      calculated++;
    }

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'DriverSalary',
        entityId: `bulk-${month}-${year}`,
        details: { month, year, count: calculated },
      },
    });

    revalidatePath('/salaries');
    return { success: true, count: calculated };
  } catch (error) {
    console.error('Calculate all salaries error:', error);
    return { success: false, error: 'Không thể tính lương hàng loạt' };
  }
}

// Adjust salary with bonuses/deductions
export async function adjustSalary(
  driverId: string,
  month: number,
  year: number,
  adjustments: {
    otherBonus?: number;
    penalties?: number;
    otherDeduction?: number;
    notes?: string;
  }
) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.driverSalary.findUnique({
      where: {
        driverId_month_year: { driverId, month, year },
      },
    });

    if (!existing) {
      return { success: false, error: 'Chưa có bảng lương cho kỳ này' };
    }

    if (existing.status === 'PAID') {
      return { success: false, error: 'Không thể điều chỉnh lương đã thanh toán' };
    }

    const otherBonus = adjustments.otherBonus ?? Number(existing.otherBonus);
    const penalties = adjustments.penalties ?? Number(existing.penalties);
    const otherDeduction = adjustments.otherDeduction ?? Number(existing.otherDeduction);

    const grossSalary = Number(existing.baseSalary) + Number(existing.tripBonus) +
                        Number(existing.mealAllowance) + otherBonus;
    const totalDeductions = Number(existing.fuelOverage) + Number(existing.advances) +
                           penalties + otherDeduction;
    const netSalary = grossSalary - totalDeductions;

    const salary = await db.driverSalary.update({
      where: {
        driverId_month_year: { driverId, month, year },
      },
      data: {
        otherBonus,
        penalties,
        otherDeduction,
        grossSalary,
        netSalary,
        notes: adjustments.notes,
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'DriverSalary',
        entityId: salary.id,
        details: { action: 'adjust', ...adjustments },
      },
    });

    revalidatePath('/salaries');
    return { success: true, data: salary };
  } catch (error) {
    console.error('Adjust salary error:', error);
    return { success: false, error: 'Không thể điều chỉnh lương' };
  }
}

// Confirm salary for payment
export async function confirmSalary(driverId: string, month: number, year: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const salary = await db.driverSalary.update({
      where: {
        driverId_month_year: { driverId, month, year },
      },
      data: {
        status: 'CONFIRMED',
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'DriverSalary',
        entityId: salary.id,
        details: { action: 'confirm', status: 'CONFIRMED' },
      },
    });

    revalidatePath('/salaries');
    return { success: true, data: salary };
  } catch (error) {
    console.error('Confirm salary error:', error);
    return { success: false, error: 'Không thể xác nhận lương' };
  }
}

// Mark salary as paid
export async function paySalary(driverId: string, month: number, year: number) {
  const session = await auth();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const salary = await db.driverSalary.update({
      where: {
        driverId_month_year: { driverId, month, year },
      },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'DriverSalary',
        entityId: salary.id,
        details: { action: 'pay', status: 'PAID' },
      },
    });

    revalidatePath('/salaries');
    return { success: true, data: salary };
  } catch (error) {
    console.error('Pay salary error:', error);
    return { success: false, error: 'Không thể thanh toán lương' };
  }
}

// Get salary summary for a period
export async function getSalarySummary(month: number, year: number) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const salaries = await db.driverSalary.findMany({
    where: { month, year },
    include: {
      driver: { select: { code: true, name: true } },
    },
  });

  const summary = {
    total: salaries.length,
    draft: salaries.filter(s => s.status === 'DRAFT').length,
    confirmed: salaries.filter(s => s.status === 'CONFIRMED').length,
    paid: salaries.filter(s => s.status === 'PAID').length,
    totalGross: salaries.reduce((sum, s) => sum + Number(s.grossSalary), 0),
    totalNet: salaries.reduce((sum, s) => sum + Number(s.netSalary), 0),
    totalAdvances: salaries.reduce((sum, s) => sum + Number(s.advances), 0),
    totalDeductions: salaries.reduce((sum, s) =>
      sum + Number(s.fuelOverage) + Number(s.penalties) + Number(s.otherDeduction), 0),
  };

  return { salaries, summary };
}
