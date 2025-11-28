import { Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { formatCurrency, formatQuantity } from '@/lib/formatters';
import { Package, TrendingUp, TrendingDown, Plus } from 'lucide-react';

async function getInventoryData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [cementTypes, totalPurchased, totalSold, monthlyPurchases, monthlySales] = await Promise.all([
    db.cementType.findMany({ where: { isActive: true } }),
    db.purchase.groupBy({
      by: ['cementTypeId'],
      _sum: { quantity: true, totalAmount: true },
    }),
    db.sale.groupBy({
      by: ['cementTypeId'],
      _sum: { quantity: true, totalAmount: true },
    }),
    db.purchase.aggregate({
      where: { purchaseDate: { gte: startOfMonth } },
      _sum: { quantity: true, totalAmount: true },
      _count: true,
    }),
    db.sale.aggregate({
      where: { saleDate: { gte: startOfMonth } },
      _sum: { quantity: true, totalAmount: true },
      _count: true,
    }),
  ]);

  const stockByType = cementTypes.map((type) => {
    const purchased = totalPurchased.find((p) => p.cementTypeId === type.id);
    const sold = totalSold.find((s) => s.cementTypeId === type.id);
    const purchasedQty = Number(purchased?._sum.quantity || 0);
    const soldQty = Number(sold?._sum.quantity || 0);

    return {
      id: type.id,
      code: type.code,
      name: type.name,
      totalPurchased: purchasedQty,
      totalSold: soldQty,
      currentStock: purchasedQty - soldQty,
      purchaseValue: Number(purchased?._sum.totalAmount || 0),
      salesValue: Number(sold?._sum.totalAmount || 0),
    };
  });

  const totalStock = stockByType.reduce((sum, t) => sum + t.currentStock, 0);
  const totalPurchaseValue = stockByType.reduce((sum, t) => sum + t.purchaseValue, 0);
  const totalSalesValue = stockByType.reduce((sum, t) => sum + t.salesValue, 0);

  return {
    stockByType,
    totalStock,
    totalPurchaseValue,
    totalSalesValue,
    monthlyPurchases: {
      quantity: Number(monthlyPurchases._sum.quantity || 0),
      amount: Number(monthlyPurchases._sum.totalAmount || 0),
      count: monthlyPurchases._count,
    },
    monthlySales: {
      quantity: Number(monthlySales._sum.quantity || 0),
      amount: Number(monthlySales._sum.totalAmount || 0),
      count: monthlySales._count,
    },
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

async function InventoryContent() {
  const data = await getInventoryData();

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tồn kho hiện tại"
          value={formatQuantity(data.totalStock)}
          description="Tổng tất cả loại xi măng"
          icon={Package}
        />
        <StatCard
          title="Nhập tháng này"
          value={formatQuantity(data.monthlyPurchases.quantity)}
          description={`${data.monthlyPurchases.count} phiếu nhập`}
          icon={TrendingDown}
        />
        <StatCard
          title="Xuất tháng này"
          value={formatQuantity(data.monthlySales.quantity)}
          description={`${data.monthlySales.count} phiếu xuất`}
          icon={TrendingUp}
        />
        <StatCard
          title="Doanh thu tháng"
          value={formatCurrency(data.monthlySales.amount)}
          description={`Chi phí: ${formatCurrency(data.monthlyPurchases.amount)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Stock by Type Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tồn kho theo loại xi măng</CardTitle>
          <CardDescription>
            Chi tiết tồn kho từng loại xi măng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.stockByType.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Chưa có dữ liệu tồn kho
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại xi măng</TableHead>
                  <TableHead className="text-right">Tổng nhập</TableHead>
                  <TableHead className="text-right">Tổng xuất</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Giá trị nhập</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stockByType.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="font-mono">
                          {item.code}
                        </Badge>
                        {item.name && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {item.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(item.totalPurchased)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(item.totalSold)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={item.currentStock < 0 ? 'text-red-600' : ''}>
                        {formatQuantity(item.currentStock)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.purchaseValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.salesValue)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Tổng cộng</TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(data.stockByType.reduce((s, t) => s + t.totalPurchased, 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(data.stockByType.reduce((s, t) => s + t.totalSold, 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(data.totalStock)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.totalPurchaseValue)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(data.totalSalesValue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function InventorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kho hàng</h1>
          <p className="text-muted-foreground">
            Tổng quan tồn kho và giao dịch nhập xuất
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory/purchases/add">
              <TrendingDown className="mr-2 h-4 w-4" />
              Nhập hàng
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/sales/add">
              <TrendingUp className="mr-2 h-4 w-4" />
              Xuất hàng
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<InventorySkeleton />}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}
