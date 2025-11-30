import { Suspense } from 'react';
import { getDriverSalaries } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calculator, User, TrendingDown, Banknote, Fuel, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { SalaryActions, SalaryRowActions, MonthYearSelector } from './SalaryActions';

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Nháp' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Xác nhận' },
  PAID: { color: 'bg-green-100 text-green-800', label: 'Đã trả' },
};

async function SalaryStats({ month, year }: { month?: number; year?: number }) {
  const salaries = await getDriverSalaries(month, year);

  const stats = {
    totalDrivers: salaries.length,
    totalGross: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
    totalNet: salaries.reduce((sum, s) => sum + s.netSalary, 0),
    totalTrips: salaries.reduce((sum, s) => sum + s.tripCount, 0),
    totalFuelOverage: salaries.reduce((sum, s) => sum + s.fuelOverageDeduction, 0),
    totalAdvances: salaries.reduce((sum, s) => sum + s.advances, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng lái xe</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDrivers}</div>
          <p className="text-xs text-muted-foreground">{stats.totalTrips} chuyến</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
          <Banknote className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalNet)}
          </div>
          <p className="text-xs text-muted-foreground">thực nhận</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trừ vượt dầu</CardTitle>
          <Fuel className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalFuelOverage)}
          </div>
          <p className="text-xs text-muted-foreground">tổng khấu trừ</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã ứng trước</CardTitle>
          <TrendingDown className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.totalAdvances)}
          </div>
          <p className="text-xs text-muted-foreground">tổng ứng lương</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function SalaryTable({ month, year }: { month: number; year: number }) {
  const salaries = await getDriverSalaries(month, year);

  if (salaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có dữ liệu lương. Bấm "Tính lương tất cả" để tạo bảng lương.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên lái xe</TableHead>
            <TableHead className="text-right">Chuyến</TableHead>
            <TableHead className="text-right">Lương cơ bản</TableHead>
            <TableHead className="text-right">Tiền chuyến</TableHead>
            <TableHead className="text-right">Tiền ăn</TableHead>
            <TableHead className="text-right">Trừ dầu</TableHead>
            <TableHead className="text-right">Đã ứng</TableHead>
            <TableHead className="text-right">Thực nhận</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salaries.map((salary) => (
            <TableRow key={salary.driverId}>
              <TableCell className="font-mono text-sm">{salary.driverCode}</TableCell>
              <TableCell className="font-medium">{salary.driverName}</TableCell>
              <TableCell className="text-right">{salary.tripCount}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(salary.baseSalary)}
              </TableCell>
              <TableCell className="text-right text-green-600">
                +{formatCurrency(salary.tripBonus)}
              </TableCell>
              <TableCell className="text-right text-blue-600">
                +{formatCurrency(salary.mealAllowance)}
              </TableCell>
              <TableCell className="text-right">
                {salary.fuelOverageDeduction > 0 ? (
                  <span className="text-red-600 flex items-center justify-end gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    -{formatCurrency(salary.fuelOverageDeduction)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {salary.advances > 0 ? (
                  <span className="text-orange-600">
                    -{formatCurrency(salary.advances)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-bold text-green-600">
                {formatCurrency(salary.netSalary)}
              </TableCell>
              <TableCell>
                <Badge className={statusConfig[salary.status]?.color}>
                  {statusConfig[salary.status]?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <SalaryRowActions
                  driverId={salary.driverId}
                  driverName={salary.driverName}
                  month={month}
                  year={year}
                  status={salary.status}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SalaryTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default async function SalariesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentDate = new Date();
  const displayMonth = params.month ? parseInt(params.month) : currentDate.getMonth() + 1;
  const displayYear = params.year ? parseInt(params.year) : currentDate.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng lương lái xe</h1>
          <p className="text-muted-foreground">
            Tháng {displayMonth}/{displayYear} - Tự động tính từ chuyến hàng
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MonthYearSelector currentMonth={displayMonth} currentYear={displayYear} />
          <SalaryActions month={displayMonth} year={displayYear} />
        </div>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <SalaryStats month={displayMonth} year={displayYear} />
      </Suspense>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chi tiết lương từng lái xe</CardTitle>
              <CardDescription>
                Lương = Cơ bản + Tiền chuyến + Tiền ăn - Vượt dầu - Ứng trước
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              <span>Quy trình: Nháp → Xác nhận → Thanh toán</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SalaryTableSkeleton />}>
            <SalaryTable month={displayMonth} year={displayYear} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
