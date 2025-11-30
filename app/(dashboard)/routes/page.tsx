import { Suspense } from 'react';
import Link from 'next/link';
import { getRoutes } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Route, Factory, MapPin, Fuel, Banknote, Truck, Plus } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

async function RouteList({ search }: { search?: string }) {
  const routes = await getRoutes(search);

  if (routes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không tìm thấy tuyến đường nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routes.map((route) => (
        <Card key={route.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Route className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{route.name}</h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {route.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Factory className="h-3 w-3" />
                      <span>{route.factory?.name || 'N/A'}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{route.customer?.shortName || route.customer?.companyName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">Khoảng cách</div>
                <div className="font-semibold">{Number(route.distance)} km</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Fuel className="h-3 w-3" />
                  <span>Định mức dầu</span>
                </div>
                <div className="font-semibold">{Number(route.fuelAllowance)} L</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Banknote className="h-3 w-3" />
                  <span>Tiền công</span>
                </div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(Number(route.driverPay))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Phí đường</span>
                </div>
                <div className="font-semibold">
                  {formatCurrency(Number(route.tollFee))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span>Chuyến tháng này</span>
                </div>
                <div className="font-semibold text-blue-600">
                  {route.monthlyTrips}
                </div>
              </div>
            </div>

            {route.monthlyTrips > 0 && (
              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                <span className="text-muted-foreground">Tháng này: </span>
                <span className="font-medium">{formatNumber(route.monthlyQuantity)} tấn</span>
                <span className="mx-2">•</span>
                <span className="font-medium">{formatNumber(route.monthlyFuel)} L dầu</span>
                <span className="mx-2">•</span>
                <span className="font-medium text-green-600">{formatCurrency(route.monthlyDriverPay)} tiền công</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RouteListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function RouteStats() {
  const routes = await getRoutes();

  const stats = {
    total: routes.length,
    totalMonthlyTrips: routes.reduce((sum, r) => sum + r.monthlyTrips, 0),
    totalMonthlyQuantity: routes.reduce((sum, r) => sum + r.monthlyQuantity, 0),
    totalMonthlyDriverPay: routes.reduce((sum, r) => sum + r.monthlyDriverPay, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng tuyến</CardTitle>
          <Route className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">tuyến đường hoạt động</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chuyến tháng này</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalMonthlyTrips)}</div>
          <p className="text-xs text-muted-foreground">tổng số chuyến</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sản lượng tháng</CardTitle>
          <Factory className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalMonthlyQuantity)}</div>
          <p className="text-xs text-muted-foreground">tấn xi măng</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiền công tháng</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalMonthlyDriverPay)}
          </div>
          <p className="text-xs text-muted-foreground">tổng tiền công lái xe</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function RoutesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search } = params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý tuyến đường</h1>
          <p className="text-muted-foreground">
            Các tuyến vận chuyển từ nhà máy đến khách hàng với định mức chi phí
          </p>
        </div>
        <Button asChild>
          <Link href="/routes/add">
            <Plus className="mr-2 h-4 w-4" />
            Thêm tuyến mới
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <RouteStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tuyến đường</CardTitle>
          <CardDescription>
            Tuyến vận chuyển với định mức dầu, tiền công và phí đường
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RouteListSkeleton />}>
            <RouteList search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
