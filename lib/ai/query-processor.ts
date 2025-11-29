import { db } from '@/lib/db';

export type QueryIntent =
  | 'top_debtors'
  | 'customer_debt'
  | 'overdue_debts'
  | 'total_receivables'
  | 'total_payables'
  | 'monthly_sales'
  | 'yearly_sales'
  | 'sales_comparison'
  | 'top_customers'
  | 'customer_info'
  | 'stock_status'
  | 'monthly_purchases'
  | 'inactive_customers'
  | 'new_customers'
  | 'general';

export interface QueryResult {
  intent: QueryIntent;
  data: Record<string, unknown>;
}

// Simple intent detection based on Vietnamese keywords
export function detectIntent(query: string): QueryIntent {
  const normalizedQuery = query.toLowerCase();

  // Debt-related queries
  if (normalizedQuery.includes('nợ') && (normalizedQuery.includes('nhiều nhất') || normalizedQuery.includes('top'))) {
    return 'top_debtors';
  }
  if (normalizedQuery.includes('quá hạn') || normalizedQuery.includes('qua han')) {
    return 'overdue_debts';
  }
  if ((normalizedQuery.includes('phải thu') || normalizedQuery.includes('công nợ')) && normalizedQuery.includes('tổng')) {
    return 'total_receivables';
  }
  if (normalizedQuery.includes('phải trả') && normalizedQuery.includes('tổng')) {
    return 'total_payables';
  }
  if (normalizedQuery.includes('nợ') && (normalizedQuery.includes('ông') || normalizedQuery.includes('bà') || normalizedQuery.includes('khách'))) {
    return 'customer_debt';
  }

  // Sales queries
  if (normalizedQuery.includes('bán') && normalizedQuery.includes('tháng')) {
    return 'monthly_sales';
  }
  if (normalizedQuery.includes('doanh thu') && normalizedQuery.includes('năm')) {
    return 'yearly_sales';
  }
  if (normalizedQuery.includes('so sánh') && normalizedQuery.includes('doanh thu')) {
    return 'sales_comparison';
  }
  if ((normalizedQuery.includes('mua nhiều') || normalizedQuery.includes('top')) && normalizedQuery.includes('khách')) {
    return 'top_customers';
  }

  // Inventory queries
  if (normalizedQuery.includes('kho') || normalizedQuery.includes('tồn')) {
    return 'stock_status';
  }
  if (normalizedQuery.includes('nhập') && normalizedQuery.includes('tháng')) {
    return 'monthly_purchases';
  }

  // Customer queries
  if (normalizedQuery.includes('thông tin') && normalizedQuery.includes('khách')) {
    return 'customer_info';
  }
  if (normalizedQuery.includes('lâu') && normalizedQuery.includes('mua')) {
    return 'inactive_customers';
  }
  if (normalizedQuery.includes('khách') && normalizedQuery.includes('mới')) {
    return 'new_customers';
  }

  return 'general';
}

export async function processQuery(query: string): Promise<QueryResult> {
  const intent = detectIntent(query);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (intent) {
    case 'top_debtors': {
      const topDebtors = await db.customer.findMany({
        where: {
          receivables: {
            some: { status: { not: 'PAID' } },
          },
        },
        select: {
          companyName: true,
          phone: true,
          receivables: {
            where: { status: { not: 'PAID' } },
            select: { remainingAmount: true, dueDate: true, status: true },
          },
        },
        take: 10,
      });

      const processed = topDebtors
        .map((c) => ({
          name: c.companyName,
          phone: c.phone,
          totalDebt: c.receivables.reduce((sum, r) => sum + Number(r.remainingAmount), 0),
          overdueCount: c.receivables.filter((r) => r.status === 'OVERDUE').length,
        }))
        .sort((a, b) => b.totalDebt - a.totalDebt)
        .slice(0, 10);

      return { intent, data: { topDebtors: processed } };
    }

    case 'overdue_debts': {
      const overdueDebts = await db.receivable.findMany({
        where: { status: 'OVERDUE' },
        include: {
          customer: { select: { companyName: true, phone: true } },
        },
        orderBy: { remainingAmount: 'desc' },
      });

      const processed = overdueDebts.map((d) => ({
        customer: d.customer.companyName,
        phone: d.customer.phone,
        amount: Number(d.remainingAmount),
        dueDate: d.dueDate,
        daysOverdue: Math.ceil((now.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      const totalOverdue = processed.reduce((sum, d) => sum + d.amount, 0);

      return { intent, data: { overdueDebts: processed, totalOverdue, count: processed.length } };
    }

    case 'total_receivables': {
      const total = await db.receivable.aggregate({
        where: { status: { not: 'PAID' } },
        _sum: { remainingAmount: true },
        _count: true,
      });

      return {
        intent,
        data: {
          totalReceivables: Number(total._sum.remainingAmount || 0),
          count: total._count,
        },
      };
    }

    case 'total_payables': {
      const total = await db.payable.aggregate({
        where: { status: { not: 'PAID' } },
        _sum: { remainingAmount: true },
        _count: true,
      });

      return {
        intent,
        data: {
          totalPayables: Number(total._sum.remainingAmount || 0),
          count: total._count,
        },
      };
    }

    case 'monthly_sales': {
      const monthlySales = await db.sale.aggregate({
        where: { saleDate: { gte: startOfMonth } },
        _sum: { totalAmount: true, quantity: true },
        _count: true,
      });

      const salesByType = await db.sale.groupBy({
        by: ['cementTypeId'],
        where: { saleDate: { gte: startOfMonth } },
        _sum: { quantity: true, totalAmount: true },
      });

      const cementTypes = await db.cementType.findMany();
      const typeMap = Object.fromEntries(cementTypes.map((t) => [t.id, t.code]));

      return {
        intent,
        data: {
          totalRevenue: Number(monthlySales._sum.totalAmount || 0),
          totalQuantity: Number(monthlySales._sum.quantity || 0),
          orderCount: monthlySales._count,
          byType: salesByType.map((s) => ({
            type: typeMap[s.cementTypeId] || s.cementTypeId,
            quantity: Number(s._sum.quantity || 0),
            revenue: Number(s._sum.totalAmount || 0),
          })),
        },
      };
    }

    case 'yearly_sales': {
      const yearlySales = await db.sale.aggregate({
        where: { saleDate: { gte: startOfYear } },
        _sum: { totalAmount: true, quantity: true },
        _count: true,
      });

      return {
        intent,
        data: {
          totalRevenue: Number(yearlySales._sum.totalAmount || 0),
          totalQuantity: Number(yearlySales._sum.quantity || 0),
          orderCount: yearlySales._count,
        },
      };
    }

    case 'sales_comparison': {
      const currentMonth = await db.sale.aggregate({
        where: { saleDate: { gte: startOfMonth } },
        _sum: { totalAmount: true, quantity: true },
      });

      const lastMonth = await db.sale.aggregate({
        where: { saleDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { totalAmount: true, quantity: true },
      });

      const currentRevenue = Number(currentMonth._sum.totalAmount || 0);
      const lastRevenue = Number(lastMonth._sum.totalAmount || 0);
      const growth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      return {
        intent,
        data: {
          currentMonth: {
            revenue: currentRevenue,
            quantity: Number(currentMonth._sum.quantity || 0),
          },
          lastMonth: {
            revenue: lastRevenue,
            quantity: Number(lastMonth._sum.quantity || 0),
          },
          growth: growth.toFixed(1),
        },
      };
    }

    case 'top_customers': {
      const topCustomers = await db.customer.findMany({
        where: {
          sales: { some: { saleDate: { gte: startOfYear } } },
        },
        select: {
          companyName: true,
          sales: {
            where: { saleDate: { gte: startOfYear } },
            select: { totalAmount: true, quantity: true },
          },
        },
      });

      const processed = topCustomers
        .map((c) => ({
          name: c.companyName,
          totalPurchases: c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
          totalQuantity: c.sales.reduce((sum, s) => sum + Number(s.quantity), 0),
        }))
        .sort((a, b) => b.totalPurchases - a.totalPurchases)
        .slice(0, 10);

      return { intent, data: { topCustomers: processed } };
    }

    case 'stock_status': {
      const totalPurchased = await db.purchase.aggregate({
        _sum: { quantity: true },
      });

      const totalSold = await db.sale.aggregate({
        _sum: { quantity: true },
      });

      const currentStock = Number(totalPurchased._sum.quantity || 0) - Number(totalSold._sum.quantity || 0);

      // By cement type
      const purchasesByType = await db.purchase.groupBy({
        by: ['cementTypeId'],
        _sum: { quantity: true },
      });

      const salesByType = await db.sale.groupBy({
        by: ['cementTypeId'],
        _sum: { quantity: true },
      });

      const cementTypes = await db.cementType.findMany();
      const stockByType = cementTypes.map((type) => {
        const purchased = purchasesByType.find((p) => p.cementTypeId === type.id)?._sum.quantity || 0;
        const sold = salesByType.find((s) => s.cementTypeId === type.id)?._sum.quantity || 0;
        return {
          type: type.code,
          purchased: Number(purchased),
          sold: Number(sold),
          stock: Number(purchased) - Number(sold),
        };
      }).filter((t) => t.purchased > 0 || t.sold > 0);

      return {
        intent,
        data: {
          currentStock,
          totalPurchased: Number(totalPurchased._sum.quantity || 0),
          totalSold: Number(totalSold._sum.quantity || 0),
          byType: stockByType,
        },
      };
    }

    case 'monthly_purchases': {
      const monthlyPurchases = await db.purchase.aggregate({
        where: { purchaseDate: { gte: startOfMonth } },
        _sum: { totalAmount: true, quantity: true },
        _count: true,
      });

      return {
        intent,
        data: {
          totalSpent: Number(monthlyPurchases._sum.totalAmount || 0),
          totalQuantity: Number(monthlyPurchases._sum.quantity || 0),
          orderCount: monthlyPurchases._count,
        },
      };
    }

    case 'inactive_customers': {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const inactiveCustomers = await db.customer.findMany({
        where: {
          isActive: true,
          OR: [
            { sales: { none: {} } },
            { sales: { every: { saleDate: { lt: threeMonthsAgo } } } },
          ],
        },
        select: {
          companyName: true,
          phone: true,
          sales: {
            orderBy: { saleDate: 'desc' },
            take: 1,
            select: { saleDate: true },
          },
        },
        take: 20,
      });

      return {
        intent,
        data: {
          inactiveCustomers: inactiveCustomers.map((c) => ({
            name: c.companyName,
            phone: c.phone,
            lastPurchase: c.sales[0]?.saleDate || null,
          })),
        },
      };
    }

    case 'new_customers': {
      const newCustomers = await db.customer.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: {
          companyName: true,
          customerType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        intent,
        data: {
          newCustomers: newCustomers.map((c) => ({
            name: c.companyName,
            type: c.customerType,
            createdAt: c.createdAt,
          })),
          count: newCustomers.length,
        },
      };
    }

    default: {
      // For general queries, provide summary data
      const [customersCount, factoriesCount, receivables, payables, monthlySales] = await Promise.all([
        db.customer.count({ where: { isActive: true } }),
        db.factory.count({ where: { isActive: true } }),
        db.receivable.aggregate({ where: { status: { not: 'PAID' } }, _sum: { remainingAmount: true } }),
        db.payable.aggregate({ where: { status: { not: 'PAID' } }, _sum: { remainingAmount: true } }),
        db.sale.aggregate({ where: { saleDate: { gte: startOfMonth } }, _sum: { totalAmount: true, quantity: true } }),
      ]);

      return {
        intent,
        data: {
          summary: {
            customers: customersCount,
            factories: factoriesCount,
            totalReceivables: Number(receivables._sum.remainingAmount || 0),
            totalPayables: Number(payables._sum.remainingAmount || 0),
            monthlyRevenue: Number(monthlySales._sum.totalAmount || 0),
            monthlyQuantity: Number(monthlySales._sum.quantity || 0),
          },
        },
      };
    }
  }
}
