import { Suspense } from 'react';
import { getVehicles } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Gauge, Fuel, User } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  BROKEN: 'bg-red-100 text-red-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  MAINTENANCE: 'Bảo dưỡng',
  BROKEN: 'Hỏng',
  RETIRED: 'Thanh lý',
};

async function VehicleList({ search, status }: { search?: string; status?: string }) {
  const vehicles = await getVehicles(search, status);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không tìm thấy xe nào
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{vehicle.plateNumber}</CardTitle>
                  <CardDescription>{vehicle.brand} {vehicle.model}</CardDescription>
                </div>
              </div>
              <Badge className={statusColors[vehicle.status]}>
                {statusLabels[vehicle.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span>{Number(vehicle.capacity)} tấn</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{vehicle.driver?.name || 'Chưa gán'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Tháng này</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Chuyến:</span>{' '}
                  <span className="font-medium">{vehicle.monthlyTrips}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{formatNumber(vehicle.monthlyFuel)} L</span>
                </div>
              </div>
            </div>

            {vehicle.lastTripDate && (
              <div className="mt-2 text-xs text-muted-foreground">
                Chuyến gần nhất: {new Date(vehicle.lastTripDate).toLocaleDateString('vi-VN')}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VehicleListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function VehicleStats() {
  const vehicles = await getVehicles();

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'ACTIVE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    monthlyTrips: vehicles.reduce((sum, v) => sum + v.monthlyTrips, 0),
    monthlyFuel: vehicles.reduce((sum, v) => sum + v.monthlyFuel, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng xe</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} đang hoạt động
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang bảo dưỡng</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.maintenance}</div>
          <p className="text-xs text-muted-foreground">xe cần sửa chữa</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chuyến tháng này</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.monthlyTrips)}</div>
          <p className="text-xs text-muted-foreground">tổng số chuyến</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nhiên liệu tháng</CardTitle>
          <Fuel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.monthlyFuel)} L</div>
          <p className="text-xs text-muted-foreground">tổng tiêu thụ</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, status } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý xe cộ</h1>
        <p className="text-muted-foreground">
          Theo dõi và quản lý đội xe bồn chở xi măng
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <VehicleStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách xe</CardTitle>
          <CardDescription>
            {status === 'MAINTENANCE' ? 'Xe đang bảo dưỡng' :
             status === 'BROKEN' ? 'Xe đang hỏng' :
             'Tất cả xe trong đội'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<VehicleListSkeleton />}>
            <VehicleList search={search} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
