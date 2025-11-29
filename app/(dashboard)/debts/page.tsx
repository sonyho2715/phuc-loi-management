import { Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, calculateDaysOverdue } from '@/lib/formatters';
import { Receipt, CreditCard, AlertTriangle, Clock, Plus } from 'lucide-react';

async function getDebtData() {
  const now = new Date();

  // Get all receivables with customer info
  const receivables = await db.receivable.findMany({
    where: { status: { not: 'PAID' } },
    include: {
      customer: { select: { companyName: true, phone: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Get all payables with factory info
  const payables = await db.payable.findMany({
    where: { status: { not: 'PAID' } },
    include: {
      factory: { select: { name: true, phone: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Calculate totals
  const totalReceivables = receivables.reduce((sum, r) => sum + Number(r.remainingAmount), 0);
  const totalPayables = payables.reduce((sum, p) => sum + Number(p.remainingAmount), 0);

  // Overdue calculations
  const overdueReceivables = receivables.filter((r) => new Date(r.dueDate) < now);
  const overduePayables = payables.filter((p) => new Date(p.dueDate) < now);

  const overdueReceivablesAmount = overdueReceivables.reduce((sum, r) => sum + Number(r.remainingAmount), 0);
  const overduePayablesAmount = overduePayables.reduce((sum, p) => sum + Number(p.remainingAmount), 0);

  // Aging analysis for receivables
  const agingReceivables = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0,
  };

  receivables.forEach((r) => {
    const daysOverdue = calculateDaysOverdue(r.dueDate);
    const amount = Number(r.remainingAmount);

    if (daysOverdue === 0) agingReceivables.current += amount;
    else if (daysOverdue <= 30) agingReceivables.days30 += amount;
    else if (daysOverdue <= 60) agingReceivables.days60 += amount;
    else if (daysOverdue <= 90) agingReceivables.days90 += amount;
    else agingReceivables.days90Plus += amount;
  });

  return {
    receivables: receivables.map((r) => ({
      ...r,
      remainingAmount: Number(r.remainingAmount),
      originalAmount: Number(r.originalAmount),
      paidAmount: Number(r.paidAmount),
      daysOverdue: calculateDaysOverdue(r.dueDate),
    })),
    payables: payables.map((p) => ({
      ...p,
      remainingAmount: Number(p.remainingAmount),
      originalAmount: Number(p.originalAmount),
      paidAmount: Number(p.paidAmount),
      daysOverdue: calculateDaysOverdue(p.dueDate),
    })),
    totalReceivables,
    totalPayables,
    overdueReceivablesAmount,
    overduePayablesAmount,
    overdueReceivablesCount: overdueReceivables.length,
    overduePayablesCount: overduePayables.length,
    agingReceivables,
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'danger';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${
            variant === 'danger'
              ? 'text-red-500'
              : variant === 'warning'
              ? 'text-yellow-500'
              : 'text-muted-foreground'
          }`}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            variant === 'danger' ? 'text-red-600' : variant === 'warning' ? 'text-yellow-600' : ''
          }`}
        >
          {value}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function DebtStatusBadge({ daysOverdue }: { daysOverdue: number }) {
  if (daysOverdue === 0) {
    return <Badge className="bg-green-100 text-green-800">Trong hạn</Badge>;
  }
  if (daysOverdue <= 30) {
    return <Badge className="bg-yellow-100 text-yellow-800">Quá {daysOverdue} ngày</Badge>;
  }
  if (daysOverdue <= 60) {
    return <Badge className="bg-orange-100 text-orange-800">Quá {daysOverdue} ngày</Badge>;
  }
  return <Badge className="bg-red-100 text-red-800">Quá {daysOverdue} ngày</Badge>;
}

async function DebtContent() {
  const data = await getDebtData();

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng phải thu"
          value={formatCurrency(data.totalReceivables)}
          description={`${data.receivables.length} khoản`}
          icon={Receipt}
        />
        <StatCard
          title="Phải thu quá hạn"
          value={formatCurrency(data.overdueReceivablesAmount)}
          description={`${data.overdueReceivablesCount} khoản quá hạn`}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Tổng phải trả"
          value={formatCurrency(data.totalPayables)}
          description={`${data.payables.length} khoản`}
          icon={CreditCard}
        />
        <StatCard
          title="Phải trả quá hạn"
          value={formatCurrency(data.overduePayablesAmount)}
          description={`${data.overduePayablesCount} khoản quá hạn`}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Aging Analysis */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Phân tích tuổi nợ phải thu</CardTitle>
          <CardDescription>Phân loại công nợ theo số ngày quá hạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Trong hạn</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(data.agingReceivables.current)}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground">1-30 ngày</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(data.agingReceivables.days30)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground">31-60 ngày</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(data.agingReceivables.days60)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground">61-90 ngày</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(data.agingReceivables.days90)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-muted-foreground">&gt;90 ngày</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(data.agingReceivables.days90Plus)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt Tables */}
      <Tabs defaultValue="receivables" className="mt-6">
        <TabsList>
          <TabsTrigger value="receivables">
            Phải thu ({data.receivables.length})
          </TabsTrigger>
          <TabsTrigger value="payables">
            Phải trả ({data.payables.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables">
          <Card>
            <CardHeader>
              <CardTitle>Công nợ phải thu</CardTitle>
              <CardDescription>Danh sách các khoản khách hàng còn nợ</CardDescription>
            </CardHeader>
            <CardContent>
              {data.receivables.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Không có công nợ phải thu
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Ngày giao dịch</TableHead>
                      <TableHead>Đến hạn</TableHead>
                      <TableHead className="text-right">Số tiền gốc</TableHead>
                      <TableHead className="text-right">Còn nợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.receivables.slice(0, 20).map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{debt.customer.companyName}</p>
                            {debt.customer.phone && (
                              <p className="text-xs text-muted-foreground">{debt.customer.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(debt.transactionDate)}</TableCell>
                        <TableCell className={debt.daysOverdue > 0 ? 'text-red-600' : ''}>
                          {formatDate(debt.dueDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(debt.originalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(debt.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          <DebtStatusBadge daysOverdue={debt.daysOverdue} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables">
          <Card>
            <CardHeader>
              <CardTitle>Công nợ phải trả</CardTitle>
              <CardDescription>Danh sách các khoản nợ nhà máy xi măng</CardDescription>
            </CardHeader>
            <CardContent>
              {data.payables.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Không có công nợ phải trả
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhà máy</TableHead>
                      <TableHead>Ngày giao dịch</TableHead>
                      <TableHead>Đến hạn</TableHead>
                      <TableHead className="text-right">Số tiền gốc</TableHead>
                      <TableHead className="text-right">Còn nợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payables.slice(0, 20).map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{debt.factory.name}</p>
                            {debt.factory.phone && (
                              <p className="text-xs text-muted-foreground">{debt.factory.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(debt.transactionDate)}</TableCell>
                        <TableCell className={debt.daysOverdue > 0 ? 'text-red-600' : ''}>
                          {formatDate(debt.dueDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(debt.originalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(debt.remainingAmount)}
                        </TableCell>
                        <TableCell>
                          <DebtStatusBadge daysOverdue={debt.daysOverdue} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function DebtSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DebtsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Công nợ</h1>
          <p className="text-muted-foreground">
            Quản lý công nợ phải thu và phải trả
          </p>
        </div>
        <Button asChild>
          <Link href="/debts/payments/add">
            <Plus className="mr-2 h-4 w-4" />
            Ghi nhận thanh toán
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DebtSkeleton />}>
        <DebtContent />
      </Suspense>
    </div>
  );
}
