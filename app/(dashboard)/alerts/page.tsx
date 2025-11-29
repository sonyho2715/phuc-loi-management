import { Suspense } from 'react';
import { getAlerts, getAlertStats } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Fuel,
  CreditCard,
  IdCard,
  Wrench,
  Package,
  Target,
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ type?: string; resolved?: string }>;
}

const alertTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  FUEL_OVERAGE: { icon: Fuel, label: 'Vượt định mức dầu', color: 'text-orange-600 bg-orange-100' },
  PAYMENT_OVERDUE: { icon: CreditCard, label: 'Công nợ quá hạn', color: 'text-red-600 bg-red-100' },
  LICENSE_EXPIRY: { icon: IdCard, label: 'Hết hạn bằng lái', color: 'text-yellow-600 bg-yellow-100' },
  VEHICLE_MAINTENANCE: { icon: Wrench, label: 'Cần bảo dưỡng', color: 'text-blue-600 bg-blue-100' },
  LOW_INVENTORY: { icon: Package, label: 'Tồn kho thấp', color: 'text-purple-600 bg-purple-100' },
  GOAL_WARNING: { icon: Target, label: 'Cảnh báo mục tiêu', color: 'text-indigo-600 bg-indigo-100' },
};

const severityConfig: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: 'bg-red-600 text-white', label: 'Nghiêm trọng' },
  HIGH: { color: 'bg-orange-500 text-white', label: 'Cao' },
  MEDIUM: { color: 'bg-yellow-500 text-white', label: 'Trung bình' },
  LOW: { color: 'bg-blue-500 text-white', label: 'Thấp' },
};

async function AlertStats() {
  const stats = await getAlertStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chưa xử lý</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.totalUnresolved}</div>
          <p className="text-xs text-muted-foreground">cảnh báo đang chờ</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nghiêm trọng</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.criticalCount}</div>
          <p className="text-xs text-muted-foreground">cần xử lý ngay</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mức cao</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.highCount}</div>
          <p className="text-xs text-muted-foreground">cần theo dõi</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalResolved}</div>
          <p className="text-xs text-muted-foreground">cảnh báo đã xong</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function AlertList({ type, resolved }: { type?: string; resolved?: string }) {
  const alerts = await getAlerts(type, resolved);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>Không có cảnh báo nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const typeConfig = alertTypeConfig[alert.alertType] || {
          icon: Bell,
          label: alert.alertType,
          color: 'text-gray-600 bg-gray-100',
        };
        const Icon = typeConfig.icon;
        const severity = severityConfig[alert.severity];

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-4 p-4 border rounded-lg ${
              alert.isResolved ? 'bg-muted/50 opacity-60' : ''
            } ${!alert.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${typeConfig.color}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{alert.title}</h3>
                <Badge className={severity?.color}>{severity?.label}</Badge>
                {alert.isResolved && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đã xử lý
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{new Date(alert.createdAt).toLocaleString('vi-VN')}</span>
                <Badge variant="outline" className="text-xs">
                  {typeConfig.label}
                </Badge>
                {alert.resolvedBy && (
                  <span>Xử lý bởi: {alert.resolvedBy}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { type, resolved } = params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cảnh báo hệ thống</h1>
        <p className="text-muted-foreground">
          Theo dõi các cảnh báo về vượt định mức, công nợ, và vận hành
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}>
        <AlertStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cảnh báo</CardTitle>
          <CardDescription>
            {resolved === 'true' ? 'Cảnh báo đã xử lý' :
             resolved === 'false' ? 'Cảnh báo chưa xử lý' :
             'Tất cả cảnh báo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AlertListSkeleton />}>
            <AlertList type={type} resolved={resolved} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
