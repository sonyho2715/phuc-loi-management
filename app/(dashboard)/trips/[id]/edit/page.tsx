'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { getTrip, updateTrip, deleteTrip } from '@/app/(dashboard)/daily/actions';
import { getDailyData } from '@/app/(dashboard)/daily/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTripPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [drivers, setDrivers] = useState<{ id: string; code: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; plateNumber: string }[]>([]);
  const [routes, setRoutes] = useState<{ id: string; code: string; name: string; driverPay: number; mealAllowance: number }[]>([]);
  const [cementTypes, setCementTypes] = useState<{ id: string; code: string; name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    tripCode: '',
    tripDate: '',
    status: '',
    vehicleId: '',
    driverId: '',
    routeId: '',
    cementTypeId: '',
    quantity: '',
    driverPay: '',
    mealAllowance: '',
    actualDriverPay: '',
    actualMeal: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tripData, refData] = await Promise.all([
          getTrip(id),
          getDailyData(new Date().toISOString().split('T')[0]),
        ]);

        setDrivers(refData.drivers);
        setVehicles(refData.vehicles);
        setRoutes(refData.routes);
        setCementTypes(refData.cementTypes);

        setForm({
          tripCode: tripData.tripCode,
          tripDate: tripData.tripDate,
          status: tripData.status,
          vehicleId: tripData.vehicleId || '',
          driverId: tripData.driverId || '',
          routeId: tripData.routeId || '',
          cementTypeId: tripData.cementTypeId || '',
          quantity: tripData.quantity.toString(),
          driverPay: tripData.driverPay?.toString() || '0',
          mealAllowance: tripData.mealAllowance?.toString() || '0',
          actualDriverPay: tripData.actualDriverPay?.toString() || '0',
          actualMeal: tripData.actualMeal?.toString() || '0',
          notes: tripData.notes || '',
        });
      } catch (error) {
        console.error('Error loading trip:', error);
        alert('Không tìm thấy chuyến hàng');
        router.push('/trips');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setForm({
        ...form,
        routeId,
        driverPay: route.driverPay.toString(),
        mealAllowance: route.mealAllowance.toString(),
        actualDriverPay: route.driverPay.toString(),
        actualMeal: route.mealAllowance.toString(),
      });
    } else {
      setForm({ ...form, routeId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.vehicleId || !form.driverId || !form.routeId || !form.quantity) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const result = await updateTrip(id, {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        routeId: form.routeId,
        cementTypeId: form.cementTypeId || null,
        quantity: parseFloat(form.quantity),
        status: form.status,
        driverPay: parseFloat(form.driverPay),
        mealAllowance: parseFloat(form.mealAllowance),
        actualDriverPay: parseFloat(form.actualDriverPay),
        actualMeal: parseFloat(form.actualMeal),
        notes: form.notes || null,
        tripDate: form.tripDate,
      });

      if (result.success) {
        router.push('/trips');
      } else {
        alert(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật chuyến hàng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa chuyến hàng này? Thao tác này không thể hoàn tác.')) return;

    setSaving(true);
    try {
      const result = await deleteTrip(id);
      if (result.success) {
        router.push('/trips');
      } else {
        alert(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi xóa chuyến hàng');
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
          <Link href="/trips">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sửa chuyến hàng</h1>
          <p className="text-muted-foreground">Mã chuyến: {form.tripCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin chuyến hàng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Ngày chuyến *</Label>
                <Input
                  type="date"
                  value={form.tripDate}
                  onChange={(e) => setForm({ ...form, tripDate: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Trạng thái *</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Chờ xuất</SelectItem>
                    <SelectItem value="IN_TRANSIT">Đang chạy</SelectItem>
                    <SelectItem value="DELIVERED">Đã giao</SelectItem>
                    <SelectItem value="CANCELLED">Hủy</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Lái xe *</Label>
                <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lái xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tuyến đường *</Label>
                <Select value={form.routeId} onValueChange={handleRouteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tuyến" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Loại xi măng</Label>
                <Select value={form.cementTypeId} onValueChange={(v) => setForm({ ...form, cementTypeId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {cementTypes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Khối lượng (tấn) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thanh toán</CardTitle>
              <CardDescription>Chi phí và tiền lương</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tiền chuyến (mặc định)</Label>
                  <Input
                    type="number"
                    value={form.driverPay}
                    onChange={(e) => setForm({ ...form, driverPay: e.target.value })}
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tiền chuyến (thực tế)</Label>
                  <Input
                    type="number"
                    value={form.actualDriverPay}
                    onChange={(e) => setForm({ ...form, actualDriverPay: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tiền ăn (mặc định)</Label>
                  <Input
                    type="number"
                    value={form.mealAllowance}
                    onChange={(e) => setForm({ ...form, mealAllowance: e.target.value })}
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tiền ăn (thực tế)</Label>
                  <Input
                    type="number"
                    value={form.actualMeal}
                    onChange={(e) => setForm({ ...form, actualMeal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Ghi chú</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa chuyến
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/trips">Hủy</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
