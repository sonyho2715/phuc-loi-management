import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Plus, FileText, Truck } from 'lucide-react';
import Link from 'next/link';

async function getSales() {
  return db.sale.findMany({
    orderBy: { saleDate: 'desc' },
    take: 100,
    include: {
      customer: { select: { companyName: true } },
      cementType: { select: { code: true, name: true } },
      vehicle: { select: { plateNumber: true } },
    },
  });
}

async function getSaleStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalThisMonth, unpaidTotal] = await Promise.all([
    db.sale.aggregate({
      where: { saleDate: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.sale.aggregate({
      where: { paymentStatus: { not: 'PAID' } },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    monthlyTotal: Number(totalThisMonth._sum.totalAmount || 0),
    monthlyCount: totalThisMonth._count,
    unpaidTotal: Number(unpaidTotal._sum.totalAmount || 0),
  };
}

export default async function SalesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [sales, stats] = await Promise.all([getSales(), getSaleStats()]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-yellow-100 text-yellow-800">Thanh toán một phần</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Chưa thanh toán</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Xuất hàng</h1>
          <p className="text-muted-foreground">
            Quản lý các giao dịch bán hàng cho khách hàng
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/sales/add">
            <Plus className="mr-2 h-4 w-4" />
            Tạo phiếu xuất
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyTotal)}</div>
            <p className="text-xs text-muted-foreground">{stats.monthlyCount} đơn hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công nợ phải thu</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.unpaidTotal)}</div>
            <p className="text-xs text-muted-foreground">Chưa thanh toán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Đơn xuất gần đây</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu xuất</CardTitle>
          <CardDescription>100 phiếu xuất gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Loại xi măng</TableHead>
                <TableHead className="text-right">Số lượng (tấn)</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead>Biển số xe</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell className="font-medium">{sale.customer.companyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.cementType.code}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{Number(sale.quantity).toLocaleString('vi-VN')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.unitPrice))}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                  <TableCell>{sale.vehicle?.plateNumber || '-'}</TableCell>
                  <TableCell>{getStatusBadge(sale.paymentStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sales.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có phiếu xuất</h3>
              <p className="text-muted-foreground mb-4">Tạo phiếu xuất đầu tiên</p>
              <Button asChild>
                <Link href="/inventory/sales/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu xuất
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
