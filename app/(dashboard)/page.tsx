import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Receipt,
  CreditCard,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { TopDebtorsChart } from '@/components/charts/top-debtors-chart';
import { RecentSalesTable } from '@/components/dashboard/recent-sales-table';

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get totals
  const [
    totalCustomers,
    totalFactories,
    totalReceivables,
    totalPayables,
    monthlySales,
    lastMonthSales,
    yearlySales,
    monthlyPurchases,
    overdueReceivables,
    recentSales,
    topDebtors,
    monthlyRevenue,
  ] = await Promise.all([
    // Total active customers
    db.customer.count({ where: { isActive: true } }),

    // Total active factories
    db.factory.count({ where: { isActive: true } }),

    // Total receivables (outstanding)
    db.receivable.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    }),

    // Total payables (outstanding)
    db.payable.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    }),

    // Monthly sales total
    db.sale.aggregate({
      where: {
        saleDate: { gte: startOfMonth },
      },
      _sum: { totalAmount: true, quantity: true },
      _count: true,
    }),

    // Last month sales for comparison
    db.sale.aggregate({
      where: {
        saleDate: { gte: lastMonth, lt: startOfMonth },
      },
      _sum: { totalAmount: true },
    }),

    // Yearly sales total
    db.sale.aggregate({
      where: {
        saleDate: { gte: startOfYear },
      },
      _sum: { totalAmount: true, quantity: true },
    }),

    // Monthly purchases
    db.purchase.aggregate({
      where: {
        purchaseDate: { gte: startOfMonth },
      },
      _sum: { totalAmount: true, quantity: true },
    }),

    // Overdue receivables
    db.receivable.aggregate({
      where: {
        status: 'OVERDUE',
      },
      _sum: { remainingAmount: true },
      _count: true,
    }),

    // Recent sales (last 10)
    db.sale.findMany({
      take: 10,
      orderBy: { saleDate: 'desc' },
      include: {
        customer: { select: { companyName: true } },
        cementType: { select: { code: true } },
      },
    }),

    // Top debtors (top 10 by remaining amount)
    db.customer.findMany({
      where: {
        receivables: {
          some: {
            status: { not: 'PAID' },
          },
        },
      },
      select: {
        id: true,
        companyName: true,
        receivables: {
          where: { status: { not: 'PAID' } },
          select: { remainingAmount: true },
        },
      },
      take: 10,
    }),

    // Monthly revenue for chart (last 12 months)
    db.$queryRaw<{ month: string; revenue: bigint }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "saleDate"), 'MM/YYYY') as month,
        COALESCE(SUM("totalAmount"), 0)::bigint as revenue
      FROM "Sale"
      WHERE "saleDate" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
      GROUP BY DATE_TRUNC('month', "saleDate")
      ORDER BY DATE_TRUNC('month', "saleDate")
    `.catch(() => []),
  ]);

  // Calculate growth
  const currentRevenue = Number(monthlySales._sum.totalAmount || 0);
  const lastRevenue = Number(lastMonthSales._sum.totalAmount || 0);
  const revenueGrowth = lastRevenue > 0
    ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
    : 0;

  // Process top debtors
  const processedTopDebtors = topDebtors
    .map((customer) => ({
      id: customer.id,
      name: customer.companyName,
      debt: customer.receivables.reduce(
        (sum, r) => sum + Number(r.remainingAmount),
        0
      ),
    }))
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 10);

  return {
    totalCustomers,
    totalFactories,
    totalReceivables: Number(totalReceivables._sum.remainingAmount || 0),
    totalPayables: Number(totalPayables._sum.remainingAmount || 0),
    monthlyRevenue: currentRevenue,
    monthlyQuantity: Number(monthlySales._sum.quantity || 0),
    monthlySalesCount: monthlySales._count,
    yearlyRevenue: Number(yearlySales._sum.totalAmount || 0),
    yearlyQuantity: Number(yearlySales._sum.quantity || 0),
    monthlyPurchases: Number(monthlyPurchases._sum.totalAmount || 0),
    purchaseQuantity: Number(monthlyPurchases._sum.quantity || 0),
    overdueAmount: Number(overdueReceivables._sum.remainingAmount || 0),
    overdueCount: overdueReceivables._count,
    revenueGrowth,
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      date: sale.saleDate,
      customer: sale.customer.companyName,
      cementType: sale.cementType.code,
      quantity: Number(sale.quantity),
      amount: Number(sale.totalAmount),
      status: sale.paymentStatus,
    })),
    topDebtors: processedTopDebtors,
    monthlyRevenueChart: (monthlyRevenue as { month: string; revenue: bigint }[]).map((item) => ({
      month: item.month,
      revenue: Number(item.revenue),
    })),
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">so với tháng trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu tháng này"
          value={formatCurrency(data.monthlyRevenue)}
          description={`${formatQuantity(data.monthlyQuantity)} đã bán`}
          icon={TrendingUp}
          trend={{
            value: data.revenueGrowth,
            isPositive: data.revenueGrowth >= 0,
          }}
        />
        <StatCard
          title="Phải thu"
          value={formatCurrency(data.totalReceivables)}
          description={`${data.overdueCount} khoản quá hạn`}
          icon={Receipt}
        />
        <StatCard
          title="Phải trả"
          value={formatCurrency(data.totalPayables)}
          icon={CreditCard}
        />
        <StatCard
          title="Khách hàng"
          value={data.totalCustomers.toString()}
          description={`${data.totalFactories} nhà máy`}
          icon={Users}
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <StatCard
          title="Doanh thu năm"
          value={formatCurrency(data.yearlyRevenue)}
          description={`${formatQuantity(data.yearlyQuantity)} đã bán`}
          icon={TrendingUp}
        />
        <StatCard
          title="Nhập hàng tháng này"
          value={formatCurrency(data.monthlyPurchases)}
          description={`${formatQuantity(data.purchaseQuantity)} nhập`}
          icon={Package}
        />
        <StatCard
          title="Công nợ quá hạn"
          value={formatCurrency(data.overdueAmount)}
          description={`${data.overdueCount} khoản quá hạn`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Số đơn hàng tháng"
          value={data.monthlySalesCount.toString()}
          description="đơn xuất hàng"
          icon={Building}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>12 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.monthlyRevenueChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khách nợ nhiều nhất</CardTitle>
            <CardDescription>Top 10 khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <TopDebtorsChart data={data.topDebtors} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>10 đơn xuất hàng gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentSalesTable sales={data.recentSales} />
        </CardContent>
      </Card>
    </>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>
        <p className="text-muted-foreground">
          Chào mừng trở lại, {session?.user?.name || 'Người dùng'}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
