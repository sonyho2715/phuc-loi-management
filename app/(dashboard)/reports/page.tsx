import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Package,
  Download,
  Calendar,
} from 'lucide-react';

async function getReportStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    monthlySales,
    monthlyPurchases,
    yearlySales,
    yearlyPurchases,
    totalCustomers,
    totalSuppliers,
    receivables,
    payables,
  ] = await Promise.all([
    db.sale.aggregate({
      where: { saleDate: { gte: startOfMonth } },
      _sum: { totalAmount: true, quantity: true },
      _count: true,
    }),
    db.purchase.aggregate({
      where: { purchaseDate: { gte: startOfMonth } },
      _sum: { totalAmount: true, quantity: true },
      _count: true,
    }),
    db.sale.aggregate({
      where: { saleDate: { gte: startOfYear } },
      _sum: { totalAmount: true },
    }),
    db.purchase.aggregate({
      where: { purchaseDate: { gte: startOfYear } },
      _sum: { totalAmount: true },
    }),
    db.customer.count({ where: { isActive: true } }),
    db.supplier.count({ where: { isActive: true } }),
    db.receivable.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    }),
    db.payable.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    }),
  ]);

  return {
    monthlySalesAmount: Number(monthlySales._sum.totalAmount || 0),
    monthlySalesQuantity: Number(monthlySales._sum.quantity || 0),
    monthlySalesCount: monthlySales._count,
    monthlyPurchasesAmount: Number(monthlyPurchases._sum.totalAmount || 0),
    monthlyPurchasesQuantity: Number(monthlyPurchases._sum.quantity || 0),
    monthlyPurchasesCount: monthlyPurchases._count,
    yearlySalesAmount: Number(yearlySales._sum.totalAmount || 0),
    yearlyPurchasesAmount: Number(yearlyPurchases._sum.totalAmount || 0),
    totalCustomers,
    totalSuppliers,
    totalReceivables: Number(receivables._sum.remainingAmount || 0),
    totalPayables: Number(payables._sum.remainingAmount || 0),
  };
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const stats = await getReportStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const grossProfit = stats.monthlySalesAmount - stats.monthlyPurchasesAmount;
  const yearlyGrossProfit = stats.yearlySalesAmount - stats.yearlyPurchasesAmount;
  const netDebt = stats.totalReceivables - stats.totalPayables;

  const reports = [
    {
      title: 'Báo cáo doanh thu',
      description: 'Tổng hợp doanh thu theo thời gian',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Báo cáo chi phí',
      description: 'Tổng hợp chi phí mua hàng',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Báo cáo công nợ',
      description: 'Phân tích công nợ phải thu và phải trả',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Báo cáo khách hàng',
      description: 'Phân tích khách hàng theo doanh thu',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Báo cáo nhà cung cấp',
      description: 'Phân tích nhà cung cấp theo giá trị',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Báo cáo tồn kho',
      description: 'Phân tích lượng hàng nhập xuất',
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-muted-foreground">
            Tổng hợp và phân tích dữ liệu kinh doanh
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Chọn kỳ
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doanh thu tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlySalesAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlySalesCount} đơn | {stats.monthlySalesQuantity.toLocaleString('vi-VN')} tấn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chi phí mua hàng tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.monthlyPurchasesAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyPurchasesCount} đơn | {stats.monthlyPurchasesQuantity.toLocaleString('vi-VN')} tấn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lợi nhuận gộp tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(grossProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Chênh lệch xuất - nhập
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ ròng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netDebt >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(Math.abs(netDebt))}
            </div>
            <p className="text-xs text-muted-foreground">
              {netDebt >= 0 ? 'Khách hàng nợ' : 'Nợ nhà cung cấp'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Year Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng kết năm {new Date().getFullYear()}</CardTitle>
          <CardDescription>Tổng hợp dữ liệu từ đầu năm đến nay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.yearlySalesAmount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tổng chi phí</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats.yearlyPurchasesAmount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lợi nhuận gộp năm</p>
              <p className={`text-xl font-bold ${yearlyGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(yearlyGrossProfit)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Đối tác</p>
              <p className="text-xl font-bold">
                {stats.totalCustomers} KH / {stats.totalSuppliers} NCC
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Loại báo cáo</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription className="text-xs">{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Tải báo cáo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
