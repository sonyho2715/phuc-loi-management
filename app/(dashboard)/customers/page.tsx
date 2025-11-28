import { Suspense } from 'react';
import Link from 'next/link';
import { getCustomers } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';
import { CustomerTable } from './customer-table';
import { CustomerFilters } from './customer-filters';

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

async function CustomerList({ search, type }: { search?: string; type?: string }) {
  const customers = await getCustomers(search, type);

  return <CustomerTable customers={customers} />;
}

function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, type } = params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách khách hàng và trạm trộn bê tông
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/add">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc theo loại khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerFilters />

          <Suspense fallback={<CustomerListSkeleton />}>
            <CustomerList search={search} type={type} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
