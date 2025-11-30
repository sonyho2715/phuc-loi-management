'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, User } from 'lucide-react';
import { getDriver, updateDriver, updateDriverStatus } from '@/app/(dashboard)/drivers/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Đang làm', color: 'bg-green-100 text-green-800' },
  ON_LEAVE: { label: 'Nghỉ phép', color: 'bg-yellow-100 text-yellow-800' },
  TERMINATED: { label: 'Đã nghỉ', color: 'bg-red-100 text-red-800' },
};

export default function EditDriverPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    phone: '',
    idNumber: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    bankAccount: '',
    bankName: '',
    baseSalary: '',
    status: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const driverData = await getDriver(id);

        if (!driverData) {
          alert('Không tìm thấy lái xe');
          router.push('/drivers');
          return;
        }

        setForm({
          code: driverData.code,
          name: driverData.name,
          phone: driverData.phone || '',
          idNumber: driverData.idNumber || '',
          address: driverData.address || '',
          licenseNumber: driverData.licenseNumber || '',
          licenseExpiry: driverData.licenseExpiry ? new Date(driverData.licenseExpiry).toISOString().split('T')[0] : '',
          bankAccount: driverData.bankAccount || '',
          bankName: driverData.bankName || '',
          baseSalary: driverData.baseSalary?.toString() || '',
          status: driverData.status,
        });
      } catch (error) {
        console.error('Error loading driver:', error);
        alert('Lỗi khi tải thông tin lái xe');
        router.push('/drivers');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code || !form.name) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      // Update driver info
      const result = await updateDriver(id, {
        code: form.code,
        name: form.name,
        phone: form.phone || undefined,
        idNumber: form.idNumber || undefined,
        address: form.address || undefined,
        licenseNumber: form.licenseNumber || undefined,
        licenseExpiry: form.licenseExpiry ? new Date(form.licenseExpiry) : null,
        bankAccount: form.bankAccount || undefined,
        bankName: form.bankName || undefined,
        baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : undefined,
      });

      if (!result.success) {
        alert(result.error || 'Lỗi khi cập nhật');
        return;
      }

      // Update status if changed
      const statusResult = await updateDriverStatus(id, form.status as 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED');
      if (!statusResult.success) {
        alert(statusResult.error || 'Lỗi khi cập nhật trạng thái');
        return;
      }

      router.push('/drivers');
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật lái xe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/drivers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sửa thông tin lái xe</h1>
            <p className="text-muted-foreground">{form.code} - {form.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin nhận dạng lái xe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Mã lái xe *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="VD: LX01"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <Badge className={statusLabels[form.status]?.color}>
                        {statusLabels[form.status]?.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang làm</SelectItem>
                      <SelectItem value="ON_LEAVE">Nghỉ phép</SelectItem>
                      <SelectItem value="TERMINATED">Đã nghỉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Họ tên *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="VD: 0912345678"
                />
              </div>

              <div className="grid gap-2">
                <Label>CMND/CCCD</Label>
                <Input
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  placeholder="VD: 030123456789"
                />
              </div>

              <div className="grid gap-2">
                <Label>Địa chỉ</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="VD: 123 Lạch Tray, Hải Phòng"
                />
              </div>
            </CardContent>
          </Card>

          {/* License & Bank Info */}
          <Card>
            <CardHeader>
              <CardTitle>Bằng lái & Ngân hàng</CardTitle>
              <CardDescription>Thông tin giấy phép và thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Số bằng lái</Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="VD: 123456789"
                />
              </div>

              <div className="grid gap-2">
                <Label>Ngày hết hạn bằng</Label>
                <Input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Số tài khoản ngân hàng</Label>
                <Input
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="VD: 1234567890"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tên ngân hàng</Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="VD: Vietcombank"
                />
              </div>

              <div className="grid gap-2">
                <Label>Lương cơ bản (đ/tháng)</Label>
                <Input
                  type="number"
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                  placeholder="VD: 5000000"
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để tính lương hàng tháng
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/drivers">Hủy</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
