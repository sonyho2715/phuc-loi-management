'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getFactories(search?: string) {
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

  const factories = await db.factory.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      purchases: {
        orderBy: { purchaseDate: 'desc' },
        take: 1,
        select: { purchaseDate: true },
      },
      payables: {
        where: { status: { not: 'PAID' } },
        select: { remainingAmount: true },
      },
      _count: {
        select: { purchases: true, routes: true },
      },
    },
  });

  // Calculate stats for each factory
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const factoriesWithStats = await Promise.all(
    factories.map(async (factory) => {
      const monthlyPurchases = await db.purchase.aggregate({
        where: {
          factoryId: factory.id,
          purchaseDate: { gte: startOfMonth },
        },
        _sum: { quantity: true, totalAmount: true },
        _count: true,
      });

      const totalDebt = factory.payables.reduce(
        (sum, p) => sum + Number(p.remainingAmount),
        0
      );

      return {
        ...factory,
        lastPurchaseDate: factory.purchases[0]?.purchaseDate || null,
        totalPurchases: factory._count.purchases,
        routeCount: factory._count.routes,
        monthlyQuantity: Number(monthlyPurchases._sum.quantity || 0),
        monthlyAmount: Number(monthlyPurchases._sum.totalAmount || 0),
        monthlyPurchaseCount: monthlyPurchases._count,
        totalDebt,
      };
    })
  );

  return factoriesWithStats;
}

export async function getFactory(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const factory = await db.factory.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { purchaseDate: 'desc' },
        take: 30,
        include: {
          cementType: { select: { code: true, name: true } },
          vehicle: { select: { plateNumber: true } },
        },
      },
      payables: {
        where: { status: { not: 'PAID' } },
        orderBy: { dueDate: 'asc' },
      },
      routes: {
        include: {
          customer: { select: { shortName: true, companyName: true } },
        },
      },
    },
  });

  return factory;
}
