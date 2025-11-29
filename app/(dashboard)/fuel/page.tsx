import { Suspense } from 'react';
import { getFuelTransactions, getFuelStats } from './actions';
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
import { Fuel, Truck, AlertTriangle, DollarSign, Droplets, GaugeCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string; vehicleId?: string; stationId?: string }>;
}

async function FuelStats() {
  const stats = await getFuelStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng dầu tháng</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalLiters)} L</div>
            <p className="text-xs text-muted-foreground">
              {stats.transactionCount} lần đổ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi phí dầu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">tháng này</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vượt định mức</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(stats.totalOverage)} L
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overageCount} lần vượt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trung bình/xe</CardTitle>
            <GaugeCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.fuelByVehicle.length > 0
                ? formatNumber(stats.totalLiters / stats.fuelByVehicle.length)
                : 0} L
            </div>
            <p className="text-xs text-muted-foreground">/xe/tháng</p>
          </CardContent>
        </Card>
      </div>

      {/* Top fuel consumers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiêu thụ theo xe</CardTitle>
          <CardDescription>Top 10 xe tiêu thụ nhiên liệu cao nhất tháng này</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.fuelByVehicle.slice(0, 10).map((vehicle, index) => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center text-sm text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{vehicle.plateNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(vehicle.liters)} L</div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.count} lần đổ
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm text-muted-foreground">
                    {formatCurrency(vehicle.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function FuelTransactionTable({ search, vehicleId, stationId }: {
  search?: string;
  vehicleId?: string;
  stationId?: string;
}) {
  const transactions = await getFuelTransactions(search, vehicleId, stationId);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có giao dịch đổ dầu nào
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Xe</TableHead>
            <TableHead>Cây dầu</TableHead>
            <TableHead>Chuyến</TableHead>
            <TableHead className="text-right">Số lít</TableHead>
            <TableHead className="text-right">Đơn giá</TableHead>
            <TableHead className="text-right">Thành tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                  {tx.vehicle?.plateNumber}
                </div>
              </TableCell>
              <TableCell>{tx.fuelStation?.name}</TableCell>
              <TableCell>
                {tx.trip ? (
                  <span className="font-mono text-xs">{tx.trip.tripCode}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNumber(Number(tx.liters))} L
              </TableCell>
              <TableCell className="text-right">
                {tx.pricePerLiter ? formatNumber(Number(tx.pricePerLiter)) : '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(tx.totalAmount))}
              </TableCell>
              <TableCell>
                {tx.isWithinLimit ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Đúng định mức
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    +{Number(tx.overLimit).toFixed(1)}L
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FuelTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default async function FuelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, vehicleId, stationId } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý nhiên liệu</h1>
        <p className="text-muted-foreground">
          Theo dõi tiêu thụ dầu và cảnh báo vượt định mức
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <FuelStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đổ dầu</CardTitle>
          <CardDescription>
            Giao dịch đổ dầu gần đây
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FuelTableSkeleton />}>
            <FuelTransactionTable search={search} vehicleId={vehicleId} stationId={stationId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
