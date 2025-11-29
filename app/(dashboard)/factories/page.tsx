import { Suspense } from 'react';
import { getFactories } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Factory, Phone, MapPin, Package, Route, Wallet } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

async function FactoryList({ search }: { search?: string }) {
  const factories = await getFactories(search);

  if (factories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không tìm thấy nhà máy nào
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {factories.map((factory) => (
        <Card key={factory.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Factory className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{factory.name}</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {factory.code}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {/* Contact Info */}
              {factory.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{factory.address}</span>
                </div>
              )}
              {factory.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{factory.phone}</span>
                </div>
              )}

              {/* Cement Brands */}
              <div className="flex flex-wrap gap-1">
                {factory.cementBrands.map((brand) => (
                  <Badge key={brand} variant="secondary" className="text-xs">
                    {brand}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">Tháng này</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span>{formatNumber(factory.monthlyQuantity)} tấn</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {formatCurrency(factory.monthlyAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Routes & Debt */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Route className="h-3 w-3" />
                  <span>{factory.routeCount} tuyến</span>
                </div>
                {factory.totalDebt > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Wallet className="h-3 w-3" />
                    <span>Nợ: {formatCurrency(factory.totalDebt)}</span>
                  </div>
                )}
              </div>

              {/* Last Purchase */}
              {factory.lastPurchaseDate && (
                <div className="text-xs text-muted-foreground">
                  Nhập gần nhất: {new Date(factory.lastPurchaseDate).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FactoryListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function FactoryStats() {
  const factories = await getFactories();

  const stats = {
    total: factories.length,
    monthlyQuantity: factories.reduce((sum, f) => sum + f.monthlyQuantity, 0),
    monthlyAmount: factories.reduce((sum, f) => sum + f.monthlyAmount, 0),
    totalDebt: factories.reduce((sum, f) => sum + f.totalDebt, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nhà máy</CardTitle>
          <Factory className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">nhà máy đối tác</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nhập tháng này</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.monthlyQuantity)}</div>
          <p className="text-xs text-muted-foreground">tấn xi măng</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Giá trị nhập</CardTitle>
          <Package className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.monthlyAmount)}</div>
          <p className="text-xs text-muted-foreground">tháng này</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Công nợ</CardTitle>
          <Wallet className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalDebt)}
          </div>
          <p className="text-xs text-muted-foreground">phải trả</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function FactoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nhà máy xi măng</h1>
        <p className="text-muted-foreground">
          Quản lý các nhà máy cung cấp xi măng rời
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <FactoryStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhà máy</CardTitle>
          <CardDescription>
            Các nhà máy xi măng đối tác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FactoryListSkeleton />}>
            <FactoryList search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
