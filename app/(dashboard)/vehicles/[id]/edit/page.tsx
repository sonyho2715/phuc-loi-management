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
import { ArrowLeft, Loader2, Save, Truck } from 'lucide-react';
import { getVehicle, updateVehicle, updateVehicleStatus, getAvailableDrivers } from '@/app/(dashboard)/vehicles/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

const vehicleTypeLabels: Record<string, string> = {
  CEMENT_TRUCK: 'Xe bồn xi măng',
  DUMP_TRUCK: 'Xe ben',
  CONTAINER: 'Xe container',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
  MAINTENANCE: { label: 'Bảo dưỡng', color: 'bg-yellow-100 text-yellow-800' },
  BROKEN: { label: 'Hỏng', color: 'bg-red-100 text-red-800' },
  RETIRED: { label: 'Ngừng sử dụng', color: 'bg-gray-100 text-gray-800' },
};

export default function EditVehiclePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState<{ id: string; code: string; name: string }[]>([]);

  const [form, setForm] = useState({
    plateNumber: '',
    vehicleType: '',
    capacity: '',
    brand: '',
    model: '',
    yearMade: '',
    status: '',
    driverId: '',
    fuelLimit: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleData, driversData] = await Promise.all([
          getVehicle(id),
          getAvailableDrivers(),
        ]);

        if (!vehicleData) {
          alert('Không tìm thấy xe');
          router.push('/vehicles');
          return;
        }

        setDrivers(driversData);

        setForm({
          plateNumber: vehicleData.plateNumber,
          vehicleType: vehicleData.vehicleType,
          capacity: vehicleData.capacity?.toString() || '',
          brand: vehicleData.brand || '',
          model: vehicleData.model || '',
          yearMade: vehicleData.yearMade?.toString() || '',
          status: vehicleData.status,
          driverId: vehicleData.driverId || '',
          fuelLimit: vehicleData.fuelLimit?.toString() || '',
        });
      } catch (error) {
        console.error('Error loading vehicle:', error);
        alert('Lỗi khi tải thông tin xe');
        router.push('/vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.plateNumber || !form.vehicleType || !form.capacity) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      // Update vehicle info
      const result = await updateVehicle(id, {
        plateNumber: form.plateNumber,
        vehicleType: form.vehicleType as 'CEMENT_TRUCK' | 'DUMP_TRUCK' | 'CONTAINER',
        capacity: parseFloat(form.capacity),
        brand: form.brand || undefined,
        model: form.model || undefined,
        yearMade: form.yearMade ? parseInt(form.yearMade) : undefined,
        driverId: form.driverId || null,
        fuelLimit: form.fuelLimit ? parseFloat(form.fuelLimit) : null,
      });

      if (!result.success) {
        alert(result.error || 'Lỗi khi cập nhật');
        return;
      }

      // Update status if changed
      const statusResult = await updateVehicleStatus(id, form.status as 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED');
      if (!statusResult.success) {
        alert(statusResult.error || 'Lỗi khi cập nhật trạng thái');
        return;
      }

      router.push('/vehicles');
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật xe');
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
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sửa thông tin xe</h1>
            <p className="text-muted-foreground">{form.plateNumber}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin nhận dạng xe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Biển số xe *</Label>
                <Input
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
                  placeholder="VD: 15C-12345"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Loại xe *</Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại xe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEMENT_TRUCK">Xe bồn xi măng</SelectItem>
                    <SelectItem value="DUMP_TRUCK">Xe ben</SelectItem>
                    <SelectItem value="CONTAINER">Xe container</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tải trọng (tấn) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="VD: 30"
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
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="MAINTENANCE">Bảo dưỡng</SelectItem>
                    <SelectItem value="BROKEN">Hỏng</SelectItem>
                    <SelectItem value="RETIRED">Ngừng sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết xe</CardTitle>
              <CardDescription>Thông tin bổ sung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hãng xe</Label>
                  <Input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="VD: Hino, Isuzu..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Model</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="VD: FM8JN7A"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Năm sản xuất</Label>
                <Input
                  type="number"
                  value={form.yearMade}
                  onChange={(e) => setForm({ ...form, yearMade: e.target.value })}
                  placeholder="VD: 2020"
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="grid gap-2">
                <Label>Định mức nhiên liệu (lít/chuyến)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.fuelLimit}
                  onChange={(e) => setForm({ ...form, fuelLimit: e.target.value })}
                  placeholder="VD: 50"
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để tính vượt dầu khi đổ nhiên liệu
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Lái xe phụ trách</Label>
                <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lái xe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không gán</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/vehicles">Hủy</Link>
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
