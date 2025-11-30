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
import { ArrowLeft, Loader2, Save, Route as RouteIcon } from 'lucide-react';
import { getRoute, updateRoute, getRouteFormData } from '@/app/(dashboard)/routes/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRoutePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [factories, setFactories] = useState<{ id: string; name: string; code: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; companyName: string; shortName: string | null }[]>([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    fromAddress: '',
    toAddress: '',
    distance: '',
    fuelAllowance: '',
    driverPay: '',
    mealAllowance: '',
    tollFee: '',
    factoryId: '',
    customerId: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routeData, formData] = await Promise.all([
          getRoute(id),
          getRouteFormData(),
        ]);

        if (!routeData) {
          alert('Không tìm thấy tuyến đường');
          router.push('/routes');
          return;
        }

        if (formData.success && formData.data) {
          setFactories(formData.data.factories);
          setCustomers(formData.data.customers);
        }

        setForm({
          code: routeData.code,
          name: routeData.name,
          fromAddress: routeData.fromAddress || '',
          toAddress: routeData.toAddress || '',
          distance: routeData.distance?.toString() || '',
          fuelAllowance: routeData.fuelAllowance?.toString() || '0',
          driverPay: routeData.driverPay?.toString() || '0',
          mealAllowance: routeData.mealAllowance?.toString() || '0',
          tollFee: routeData.tollFee?.toString() || '0',
          factoryId: routeData.factoryId || '',
          customerId: routeData.customerId || '',
        });
      } catch (error) {
        console.error('Error loading route:', error);
        alert('Lỗi khi tải thông tin tuyến đường');
        router.push('/routes');
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
      const result = await updateRoute(id, {
        code: form.code,
        name: form.name,
        fromAddress: form.fromAddress || undefined,
        toAddress: form.toAddress || undefined,
        distance: form.distance ? parseFloat(form.distance) : undefined,
        fuelAllowance: parseFloat(form.fuelAllowance) || 0,
        driverPay: parseFloat(form.driverPay) || 0,
        mealAllowance: parseFloat(form.mealAllowance) || 0,
        tollFee: parseFloat(form.tollFee) || 0,
        factoryId: form.factoryId || null,
        customerId: form.customerId || null,
      });

      if (result.success) {
        router.push('/routes');
      } else {
        alert(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật tuyến đường');
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
          <Link href="/routes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <RouteIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sửa tuyến đường</h1>
            <p className="text-muted-foreground">{form.code} - {form.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tuyến</CardTitle>
              <CardDescription>Thông tin cơ bản về tuyến đường</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Mã tuyến *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="VD: TD01"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Khoảng cách (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    placeholder="VD: 50"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tên tuyến *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Hải Phòng - Hà Nội"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Điểm xuất phát</Label>
                <Input
                  value={form.fromAddress}
                  onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
                  placeholder="VD: Nhà máy Hải Phòng"
                />
              </div>

              <div className="grid gap-2">
                <Label>Điểm đến</Label>
                <Input
                  value={form.toAddress}
                  onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
                  placeholder="VD: Trạm trộn ABC"
                />
              </div>

              <div className="grid gap-2">
                <Label>Nhà máy</Label>
                <Select value={form.factoryId} onValueChange={(v) => setForm({ ...form, factoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà máy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn</SelectItem>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.code} - {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Khách hàng</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.shortName || c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cost Info */}
          <Card>
            <CardHeader>
              <CardTitle>Chi phí tuyến</CardTitle>
              <CardDescription>Định mức chi phí cho mỗi chuyến</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Định mức nhiên liệu (lít)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.fuelAllowance}
                  onChange={(e) => setForm({ ...form, fuelAllowance: e.target.value })}
                  placeholder="VD: 50"
                />
                <p className="text-xs text-muted-foreground">
                  Số lít dầu cho phép mỗi chuyến
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Tiền chuyến lái xe (đ)</Label>
                <Input
                  type="number"
                  value={form.driverPay}
                  onChange={(e) => setForm({ ...form, driverPay: e.target.value })}
                  placeholder="VD: 500000"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tiền ăn (đ)</Label>
                <Input
                  type="number"
                  value={form.mealAllowance}
                  onChange={(e) => setForm({ ...form, mealAllowance: e.target.value })}
                  placeholder="VD: 100000"
                />
              </div>

              <div className="grid gap-2">
                <Label>Phí cầu đường (đ)</Label>
                <Input
                  type="number"
                  value={form.tollFee}
                  onChange={(e) => setForm({ ...form, tollFee: e.target.value })}
                  placeholder="VD: 50000"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Tổng chi phí/chuyến</h4>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    (parseFloat(form.fuelAllowance) || 0) * 24500 +
                    (parseFloat(form.driverPay) || 0) +
                    (parseFloat(form.mealAllowance) || 0) +
                    (parseFloat(form.tollFee) || 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dầu ({form.fuelAllowance || 0}L x 24.500đ) + Tiền chuyến + Tiền ăn + Cầu đường
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/routes">Hủy</Link>
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
