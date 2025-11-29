import { Suspense } from 'react';
import { getTrips } from './actions';
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
import { Navigation, Truck, User, Factory, MapPin, Fuel, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; dateFrom?: string; dateTo?: string }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xuất phát',
  IN_TRANSIT: 'Đang chạy',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

async function TripTable({ search, status, dateFrom, dateTo }: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const trips = await getTrips(search, status, dateFrom, dateTo);

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không tìm thấy chuyến hàng nào
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã chuyến</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Xe / Lái xe</TableHead>
            <TableHead>Tuyến</TableHead>
            <TableHead>Xi măng</TableHead>
            <TableHead className="text-right">Số tấn</TableHead>
            <TableHead className="text-right">Dầu</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-mono text-sm">{trip.tripCode}</TableCell>
              <TableCell>
                {new Date(trip.tripDate).toLocaleDateString('vi-VN')}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-sm">
                    <Truck className="h-3 w-3" />
                    {trip.vehicle?.plateNumber}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {trip.driver?.name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <div className="flex items-center gap-1">
                    <Factory className="h-3 w-3" />
                    {trip.route?.factory?.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {trip.route?.customer?.shortName || trip.route?.customer?.companyName}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{trip.cementType?.code}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNumber(Number(trip.quantity))} T
              </TableCell>
              <TableCell className="text-right">
                {trip.actualFuel ? (
                  <div className="flex items-center justify-end gap-1">
                    <Fuel className="h-3 w-3" />
                    <span>{formatNumber(Number(trip.actualFuel))} L</span>
                    {trip.fuelVariance !== null && trip.fuelVariance > 0 && (
                      <span className="text-red-600 text-xs flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        +{trip.fuelVariance.toFixed(1)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[trip.status]}>
                  {statusLabels[trip.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TripTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

async function TripStats() {
  const allTrips = await getTrips();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: allTrips.length,
    todayTrips: allTrips.filter(t => new Date(t.tripDate) >= today).length,
    inTransit: allTrips.filter(t => t.status === 'IN_TRANSIT').length,
    delivered: allTrips.filter(t => t.status === 'DELIVERED').length,
    fuelOverage: allTrips.filter(t => t.fuelVariance && t.fuelVariance > 0).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng chuyến</CardTitle>
          <Navigation className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
          <Navigation className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.todayTrips}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang chạy</CardTitle>
          <Truck className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.inTransit}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã giao</CardTitle>
          <Navigation className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vượt định mức</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.fuelOverage}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TripsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, status, dateFrom, dateTo } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý chuyến hàng</h1>
        <p className="text-muted-foreground">
          Theo dõi các chuyến vận chuyển xi măng từ nhà máy đến khách hàng
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <TripStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chuyến hàng</CardTitle>
          <CardDescription>
            {status ? `Chuyến ${statusLabels[status]?.toLowerCase()}` : 'Tất cả chuyến hàng gần đây'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TripTableSkeleton />}>
            <TripTable search={search} status={status} dateFrom={dateFrom} dateTo={dateTo} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
