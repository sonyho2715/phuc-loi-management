import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

async function getSuppliers() {
  return db.supplier.findMany({
    where: { isActive: true },
    orderBy: { companyName: 'asc' },
    include: {
      _count: { select: { purchases: true } },
      payables: {
        where: { status: { not: 'PAID' } },
        select: { remainingAmount: true },
      },
    },
  });
}

export default async function SuppliersPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const suppliers = await getSuppliers();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nhà cung cấp</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin nhà cung cấp xi măng
          </p>
        </div>
        <Button asChild>
          <Link href="/suppliers/add">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhà cung cấp
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => {
          const totalDebt = supplier.payables.reduce(
            (sum, p) => sum + Number(p.remainingAmount),
            0
          );
          return (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.companyName}</CardTitle>
                      <CardDescription>{supplier.contactPerson || 'Chưa có liên hệ'}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {supplier.address}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 pt-2">
                  {supplier.cementBrands.map((brand) => (
                    <Badge key={brand} variant="secondary" className="text-xs">
                      {brand}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Công nợ: </span>
                    <span className={totalDebt > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {formatCurrency(totalDebt)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {supplier._count.purchases} đơn hàng
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có nhà cung cấp</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu bằng cách thêm nhà cung cấp đầu tiên
            </p>
            <Button asChild>
              <Link href="/suppliers/add">
                <Plus className="mr-2 h-4 w-4" />
                Thêm nhà cung cấp
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
