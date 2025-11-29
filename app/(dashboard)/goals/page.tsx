import { Suspense } from 'react';
import { getCurrentYearGoal, getBusinessGoals } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, Truck, Users, Package, Calendar } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

function ProgressCard({
  title,
  icon: Icon,
  current,
  target,
  progress,
  unit,
  color,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  current: number;
  target: number;
  progress: number;
  unit: string;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-2xl font-bold ${color}`}>
                {unit === 'đ' ? formatCurrency(current) : formatNumber(current)}
              </span>
              {unit !== 'đ' && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              / {unit === 'đ' ? formatCurrency(target) : formatNumber(target)} {unit !== 'đ' && unit}
            </div>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}% hoàn thành</span>
            <span>
              Còn {unit === 'đ'
                ? formatCurrency(Math.max(target - current, 0))
                : formatNumber(Math.max(target - current, 0))}
              {unit !== 'đ' && ` ${unit}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function GoalDashboard() {
  const goal = await getCurrentYearGoal();

  if (!goal) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Chưa có mục tiêu cho năm nay
        </CardContent>
      </Card>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const monthsPassed = currentMonth;
  const expectedProgress = (monthsPassed / 12) * 100;

  return (
    <div className="space-y-6">
      {/* Main Target Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Mục tiêu năm {goal.year}</CardTitle>
              <CardDescription>
                Doanh thu mục tiêu: {formatCurrency(Number(goal.revenueTarget))}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-4xl font-bold text-blue-600">
                    {formatCurrency(goal.revenueActual)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-blue-600">
                    {goal.revenueProgress.toFixed(1)}%
                  </span>
                  <p className="text-sm text-muted-foreground">hoàn thành</p>
                </div>
              </div>
              <Progress value={Math.min(goal.revenueProgress, 100)} className="h-4" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Tiến độ thời gian</div>
                <div className="text-lg font-semibold">{expectedProgress.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Tháng {currentMonth}/12</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Còn thiếu</div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatCurrency(Math.max(Number(goal.revenueTarget) - goal.revenueActual, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Trạng thái</div>
                <div className={`text-lg font-semibold ${
                  goal.revenueProgress >= expectedProgress ? 'text-green-600' : 'text-red-600'
                }`}>
                  {goal.revenueProgress >= expectedProgress ? 'Đạt tiến độ' : 'Chậm tiến độ'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-goals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProgressCard
          title="Sản lượng"
          icon={Package}
          current={goal.volumeActual}
          target={Number(goal.volumeTarget || 0)}
          progress={goal.volumeProgress}
          unit="tấn"
          color="text-green-600"
        />
        <ProgressCard
          title="Số chuyến"
          icon={Truck}
          current={goal.tripActual}
          target={goal.tripTarget || 0}
          progress={goal.tripProgress}
          unit="chuyến"
          color="text-blue-600"
        />
        <ProgressCard
          title="Khách hàng mới"
          icon={Users}
          current={goal.newCustomerActual}
          target={goal.newCustomerTarget || 0}
          progress={goal.customerProgress}
          unit="KH"
          color="text-purple-600"
        />
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Doanh thu trung bình</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {formatCurrency(goal.revenueActual / Math.max(currentMonth, 1))}
              </div>
              <p className="text-xs text-muted-foreground">/tháng</p>
              <div className="text-sm text-muted-foreground pt-2">
                Cần trung bình: {formatCurrency(Number(goal.revenueTarget) / 12)}/tháng
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function YearlyGoals() {
  const goals = await getBusinessGoals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử mục tiêu</CardTitle>
        <CardDescription>So sánh mục tiêu qua các năm</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">{goal.year}</div>
                <div className="text-sm text-muted-foreground">
                  Mục tiêu: {formatCurrency(Number(goal.revenueTarget))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(Number(goal.revenueActual))}</div>
                  <div className="text-xs text-muted-foreground">
                    {((Number(goal.revenueActual) / Number(goal.revenueTarget)) * 100).toFixed(1)}%
                  </div>
                </div>
                <Progress
                  value={Math.min((Number(goal.revenueActual) / Number(goal.revenueTarget)) * 100, 100)}
                  className="w-24 h-2"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mục tiêu kinh doanh</h1>
        <p className="text-muted-foreground">
          Theo dõi tiến độ đạt mục tiêu doanh thu và sản lượng
        </p>
      </div>

      <Suspense fallback={<GoalDashboardSkeleton />}>
        <GoalDashboard />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48" />}>
        <YearlyGoals />
      </Suspense>
    </div>
  );
}
