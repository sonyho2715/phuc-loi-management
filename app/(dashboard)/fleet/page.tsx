import { Suspense } from 'react';
import Link from 'next/link';
import { getFleetOverview } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  User,
  MapPin,
  Fuel,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Plus,
  RefreshCw,
  Navigation,
  Wrench,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

const tripStatusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ xuất', icon: <Clock className="h-3 w-3" /> },
  IN_TRANSIT: { color: 'bg-blue-100 text-blue-800', label: 'Đang chạy', icon: <Navigation className="h-3 w-3" /> },
  DELIVERED: { color: 'bg-green-100 text-green-800', label: 'Đã giao', icon: <CheckCircle className="h-3 w-3" /> },
  CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Hủy', icon: <XCircle className="h-3 w-3" /> },
};

const alertSeverityConfig: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

async function FleetStats() {
  const data = await getFleetOverview();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Xe hoạt động</CardTitle>
          <Truck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.vehicles.active}</div>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-blue-600">{data.vehicles.inTransit} đang chạy</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-green-600">{data.vehicles.available} sẵn sàng</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chuyến hôm nay</CardTitle>
          <Package className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.trips.today}</div>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-green-600">{data.trips.delivered} xong</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-blue-600">{data.trips.inTransit} đang chạy</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-yellow-600">{data.trips.pending} chờ</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lái xe trực</CardTitle>
          <User className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.drivers.onDuty}</div>
          <div className="text-xs text-muted-foreground mt-1">
            / {data.drivers.total} lái xe
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nhiên liệu hôm nay</CardTitle>
          <Fuel className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(data.fuel.todayLiters)} L</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(data.fuel.todayAmount)} ({data.fuel.transactions} lần đổ)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function VehiclesInTransit() {
  const data = await getFleetOverview();

  if (data.vehiclesInTransit.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Không có xe đang trên đường</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.vehiclesInTransit.map((trip) => (
        <div
          key={trip.tripId}
          className="flex items-center justify-between p-3 rounded-lg border bg-blue-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{trip.vehicle.plateNumber}</div>
              <div className="text-sm text-muted-foreground">
                {trip.driver?.name} • {trip.route?.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-blue-100 text-blue-800">
              <Navigation className="h-3 w-3 mr-1" />
              Đang chạy
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {trip.route?.distance ? `${Number(trip.route.distance)} km` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function AvailableVehicles() {
  const data = await getFleetOverview();

  if (data.availableVehicles.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Tất cả xe đang bận</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.availableVehicles.slice(0, 5).map((vehicle) => (
        <div
          key={vehicle.id}
          className="flex items-center justify-between p-2 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="font-medium">{vehicle.plateNumber}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {vehicle.driver || 'Chưa gán lái xe'}
          </span>
        </div>
      ))}
    </div>
  );
}

async function TodayTripsTable() {
  const data = await getFleetOverview();

  if (data.todayTrips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Chưa có chuyến hàng nào hôm nay</p>
        <Button asChild className="mt-4">
          <Link href="/trips/add">
            <Plus className="mr-2 h-4 w-4" />
            Tạo chuyến mới
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã chuyến</TableHead>
            <TableHead>Xe</TableHead>
            <TableHead>Lái xe</TableHead>
            <TableHead>Tuyến</TableHead>
            <TableHead className="text-right">Khối lượng</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.todayTrips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-mono text-sm">{trip.tripCode}</TableCell>
              <TableCell>{trip.vehicle}</TableCell>
              <TableCell>{trip.driver}</TableCell>
              <TableCell>{trip.route}</TableCell>
              <TableCell className="text-right">
                {formatNumber(trip.quantity)} tấn
              </TableCell>
              <TableCell>
                <Badge className={tripStatusConfig[trip.status]?.color}>
                  {tripStatusConfig[trip.status]?.icon}
                  <span className="ml-1">{tripStatusConfig[trip.status]?.label}</span>
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function RecentAlerts() {
  const data = await getFleetOverview();

  if (data.recentAlerts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>Không có cảnh báo</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.recentAlerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-red-50"
        >
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-sm">{alert.title}</div>
            <div className="text-xs text-muted-foreground">{alert.message}</div>
          </div>
          <Badge className={alertSeverityConfig[alert.severity]}>
            {alert.severity}
          </Badge>
        </div>
      ))}
    </div>
  );
}

async function MaintenanceStatus() {
  const data = await getFleetOverview();

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-3 rounded-lg bg-green-50">
        <div className="text-2xl font-bold text-green-600">{data.vehicles.active}</div>
        <div className="text-xs text-muted-foreground">Hoạt động</div>
      </div>
      <div className="p-3 rounded-lg bg-yellow-50">
        <div className="text-2xl font-bold text-yellow-600">{data.vehicles.maintenance}</div>
        <div className="text-xs text-muted-foreground">Bảo dưỡng</div>
      </div>
      <div className="p-3 rounded-lg bg-red-50">
        <div className="text-2xl font-bold text-red-600">{data.vehicles.broken}</div>
        <div className="text-xs text-muted-foreground">Hỏng</div>
      </div>
    </div>
  );
}

function FleetSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default async function FleetDashboardPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển đội xe</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/trips/add">
              <Plus className="mr-2 h-4 w-4" />
              Tạo chuyến mới
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<FleetSkeleton />}>
        <FleetStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Vehicles in Transit */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-500" />
                  Xe đang trên đường
                </CardTitle>
                <CardDescription>Theo dõi vị trí và trạng thái xe</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-40" />}>
              <VehiclesInTransit />
            </Suspense>
          </CardContent>
        </Card>

        {/* Vehicle Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tình trạng xe
            </CardTitle>
            <CardDescription>Tổng quan đội xe</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-24" />}>
              <MaintenanceStatus />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Today's Trips */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Chuyến hàng hôm nay
                </CardTitle>
                <CardDescription>Danh sách tất cả chuyến trong ngày</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/trips">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <TodayTripsTable />
            </Suspense>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Available Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-green-500" />
                Xe sẵn sàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-32" />}>
                <AvailableVehicles />
              </Suspense>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Cảnh báo gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-32" />}>
                <RecentAlerts />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
