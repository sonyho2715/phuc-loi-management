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
import { CreditCard, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

async function getPayables() {
  return db.payable.findMany({
    where: { status: { not: 'PAID' } },
    orderBy: { dueDate: 'asc' },
    include: {
      supplier: { select: { id: true, companyName: true, phone: true } },
    },
  });
}

async function getPayableStats() {
  const [current, overdue, total] = await Promise.all([
    db.payable.aggregate({
      where: { status: 'CURRENT' },
      _sum: { remainingAmount: true },
      _count: true,
    }),
    db.payable.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { remainingAmount: true },
      _count: true,
    }),
    db.payable.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { remainingAmount: true },
    }),
  ]);

  return {
    currentAmount: Number(current._sum.remainingAmount || 0),
    currentCount: current._count,
    overdueAmount: Number(overdue._sum.remainingAmount || 0),
    overdueCount: overdue._count,
    totalAmount: Number(total._sum.remainingAmount || 0),
  };
}

export default async function PayablesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [payables, stats] = await Promise.all([getPayables(), getPayableStats()]);

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

  const getDaysOverdue = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status: string, dueDate: Date) => {
    if (status === 'OVERDUE') {
      const days = getDaysOverdue(dueDate);
      return (
        <Badge className="bg-red-100 text-red-800">
          Quá hạn {days} ngày
        </Badge>
      );
    }
    return <Badge className="bg-blue-100 text-blue-800">Trong hạn</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Công nợ phải trả</h1>
          <p className="text-muted-foreground">
            Quản lý các khoản phải trả cho nhà cung cấp
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng phải trả</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentCount + stats.overdueCount} khoản chưa trả
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trong hạn</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.currentAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.currentCount} khoản</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} khoản</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ phải trả</CardTitle>
          <CardDescription>Các khoản chưa thanh toán cho nhà cung cấp</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Ngày giao dịch</TableHead>
                <TableHead>Hạn thanh toán</TableHead>
                <TableHead className="text-right">Số tiền gốc</TableHead>
                <TableHead className="text-right">Đã trả</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell>
                    <span className="font-medium">{payable.supplier.companyName}</span>
                    {payable.supplier.phone && (
                      <div className="text-xs text-muted-foreground">{payable.supplier.phone}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(payable.transactionDate)}</TableCell>
                  <TableCell>{formatDate(payable.dueDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(payable.originalAmount))}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(Number(payable.paidAmount))}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {formatCurrency(Number(payable.remainingAmount))}
                  </TableCell>
                  <TableCell>{getStatusBadge(payable.status, payable.dueDate)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ghi nhận thanh toán
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payables.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có công nợ phải trả</h3>
              <p className="text-muted-foreground">Tất cả các khoản đã được thanh toán</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
