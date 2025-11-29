import { Suspense } from 'react';
import { getDrivers } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Phone, Truck, Banknote, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800',
  TERMINATED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Đang làm',
  ON_LEAVE: 'Nghỉ phép',
  TERMINATED: 'Đã nghỉ',
};

async function DriverList({ search, status }: { search?: string; status?: string }) {
  const drivers = await getDrivers(search, status);

  if (drivers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không tìm thấy lái xe nào
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {drivers.map((driver) => (
        <Card key={driver.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <span className="font-mono">{driver.code}</span>
                    {driver.phone && (
                      <>
                        <span className="mx-1">•</span>
                        <Phone className="h-3 w-3" />
                        <span>{driver.phone}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge className={statusColors[driver.status]}>
                {statusLabels[driver.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Assigned Vehicles */}
              {driver.vehicles.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {driver.vehicles.map(v => v.plateNumber).join(', ')}
                  </span>
                </div>
              )}

              {/* Monthly Stats */}
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">Tháng này</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span>{driver.monthlyTrips} chuyến</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Banknote className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(driver.monthlyEarnings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advances */}
              {driver.monthlyAdvances > 0 && (
                <div className="text-xs text-orange-600">
                  Đã ứng: {formatCurrency(driver.monthlyAdvances)}
                </div>
              )}

              {/* Last Trip */}
              {driver.lastTripDate && (
                <div className="text-xs text-muted-foreground">
                  Chuyến gần nhất: {new Date(driver.lastTripDate).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DriverListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function DriverStats() {
  const drivers = await getDrivers();

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'ACTIVE').length,
    onLeave: drivers.filter(d => d.status === 'ON_LEAVE').length,
    totalMonthlyTrips: drivers.reduce((sum, d) => sum + d.monthlyTrips, 0),
    totalMonthlyEarnings: drivers.reduce((sum, d) => sum + d.monthlyEarnings, 0),
    totalAdvances: drivers.reduce((sum, d) => sum + d.monthlyAdvances, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng lái xe</CardTitle>
          <UserCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} đang làm việc
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chuyến tháng này</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalMonthlyTrips)}</div>
          <p className="text-xs text-muted-foreground">tổng số chuyến</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiền công tháng</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalMonthlyEarnings)}
          </div>
          <p className="text-xs text-muted-foreground">tổng tiền công</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã ứng lương</CardTitle>
          <Banknote className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.totalAdvances)}
          </div>
          <p className="text-xs text-muted-foreground">tổng ứng trước</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DriversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, status } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý lái xe</h1>
        <p className="text-muted-foreground">
          Theo dõi đội ngũ lái xe và thu nhập hàng tháng
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <DriverStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lái xe</CardTitle>
          <CardDescription>
            {status === 'ON_LEAVE' ? 'Lái xe đang nghỉ phép' :
             status === 'TERMINATED' ? 'Lái xe đã nghỉ việc' :
             'Tất cả lái xe'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DriverListSkeleton />}>
            <DriverList search={search} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
