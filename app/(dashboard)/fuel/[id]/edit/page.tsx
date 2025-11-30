'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Fuel } from 'lucide-react';
import { getFuelTransaction, updateFuelTransaction } from '@/app/(dashboard)/daily/actions';
import { getDailyData } from '@/app/(dashboard)/daily/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditFuelPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [drivers, setDrivers] = useState<{ id: string; code: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; plateNumber: string }[]>([]);

  const [form, setForm] = useState({
    transactionDate: '',
    vehicleId: '',
    driverId: '',
    liters: '',
    pricePerLiter: '',
    station: '',
    odometerReading: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fuelData, refData] = await Promise.all([
          getFuelTransaction(id),
          getDailyData(new Date().toISOString().split('T')[0]),
        ]);

        setDrivers(refData.drivers);
        setVehicles(refData.vehicles);

        setForm({
          transactionDate: fuelData.transactionDate,
          vehicleId: fuelData.vehicleId || '',
          driverId: fuelData.driverId || '',
          liters: fuelData.liters.toString(),
          pricePerLiter: fuelData.pricePerLiter.toString(),
          station: fuelData.station || '',
          odometerReading: fuelData.odometerReading?.toString() || '',
        });
      } catch (error) {
        console.error('Error loading fuel:', error);
        alert('Không tìm thấy giao dịch nhiên liệu');
        router.push('/fuel');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.vehicleId || !form.liters) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const result = await updateFuelTransaction(id, {
        vehicleId: form.vehicleId,
        driverId: form.driverId || null,
        liters: parseFloat(form.liters),
        pricePerLiter: parseFloat(form.pricePerLiter),
        station: form.station || null,
        odometerReading: form.odometerReading ? parseInt(form.odometerReading) : null,
        transactionDate: form.transactionDate,
      });

      if (result.success) {
        router.push('/fuel');
      } else {
        alert(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật giao dịch');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = (parseFloat(form.liters) || 0) * (parseFloat(form.pricePerLiter) || 0);

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
          <Link href="/fuel">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Fuel className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sửa giao dịch nhiên liệu</h1>
            <p className="text-muted-foreground">Cập nhật thông tin đổ dầu</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Thông tin giao dịch</CardTitle>
            <CardDescription>Cập nhật chi tiết đổ nhiên liệu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Ngày giao dịch *</Label>
              <Input
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Xe *</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn xe" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plateNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Lái xe</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lái xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Số lít *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.liters}
                  onChange={(e) => setForm({ ...form, liters: e.target.value })}
                  placeholder="VD: 100"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Đơn giá (đ/lít)</Label>
                <Input
                  type="number"
                  value={form.pricePerLiter}
                  onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })}
                  placeholder="VD: 24500"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Trạm xăng</Label>
              <Input
                value={form.station}
                onChange={(e) => setForm({ ...form, station: e.target.value })}
                placeholder="VD: Petrolimex Cầu Rào"
              />
            </div>

            <div className="grid gap-2">
              <Label>Số km đồng hồ</Label>
              <Input
                type="number"
                value={form.odometerReading}
                onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
                placeholder="VD: 125000"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Thành tiền</h4>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {form.liters || 0} lít x {new Intl.NumberFormat('vi-VN').format(parseFloat(form.pricePerLiter) || 0)} đ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6 max-w-2xl">
          <Button type="button" variant="outline" asChild>
            <Link href="/fuel">Hủy</Link>
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
