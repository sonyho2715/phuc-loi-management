'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getBusinessGoals() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const goals = await db.businessGoal.findMany({
    orderBy: { year: 'desc' },
  });

  return goals;
}

export async function getCurrentYearGoal() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const currentYear = new Date().getFullYear();

  const goal = await db.businessGoal.findUnique({
    where: { year: currentYear },
  });

  if (!goal) return null;

  // Calculate current progress from actual data
  const startOfYear = new Date(currentYear, 0, 1);

  // Total revenue from sales
  const salesStats = await db.sale.aggregate({
    where: {
      saleDate: { gte: startOfYear },
    },
    _sum: { totalAmount: true, quantity: true },
    _count: true,
  });

  // Total trips
  const tripCount = await db.trip.count({
    where: {
      tripDate: { gte: startOfYear },
      status: 'DELIVERED',
    },
  });

  // New customers this year
  const newCustomers = await db.customer.count({
    where: {
      createdAt: { gte: startOfYear },
    },
  });

  return {
    ...goal,
    revenueActual: Number(salesStats._sum.totalAmount || 0),
    volumeActual: Number(salesStats._sum.quantity || 0),
    tripActual: tripCount,
    newCustomerActual: newCustomers,
    revenueProgress: Number(goal.revenueTarget) > 0
      ? (Number(salesStats._sum.totalAmount || 0) / Number(goal.revenueTarget)) * 100
      : 0,
    volumeProgress: Number(goal.volumeTarget) > 0
      ? (Number(salesStats._sum.quantity || 0) / Number(goal.volumeTarget)) * 100
      : 0,
    tripProgress: (goal.tripTarget || 0) > 0
      ? (tripCount / (goal.tripTarget || 1)) * 100
      : 0,
    customerProgress: (goal.newCustomerTarget || 0) > 0
      ? (newCustomers / (goal.newCustomerTarget || 1)) * 100
      : 0,
  };
}

export async function getMonthlySummaries(year: number) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const summaries = await db.monthlySummary.findMany({
    where: { year },
    orderBy: { month: 'asc' },
  });

  return summaries;
}
