import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/forms/customer-form';
import { ArrowLeft } from 'lucide-react';

export default function AddCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm khách hàng</h1>
          <p className="text-muted-foreground">
            Tạo khách hàng hoặc trạm trộn bê tông mới
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
          <CardDescription>
            Điền thông tin khách hàng. Các trường có dấu * là bắt buộc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
