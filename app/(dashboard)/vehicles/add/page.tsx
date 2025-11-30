'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Truck, Loader2 } from 'lucide-react';
import { createVehicle, getAvailableDrivers } from '../actions';

interface Driver {
  id: string;
  code: string;
  name: string;
  phone: string | null;
}

export default function AddVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleType: 'CEMENT_TRUCK' as 'CEMENT_TRUCK' | 'DUMP_TRUCK' | 'CONTAINER',
    capacity: '',
    brand: '',
    model: '',
    yearMade: '',
    driverId: '',
  });

  useEffect(() => {
    async function loadDrivers() {
      try {
        const data = await getAvailableDrivers();
        setDrivers(data);
      } catch (error) {
        console.error('Failed to load drivers:', error);
      }
    }
    loadDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createVehicle({
        plateNumber: formData.plateNumber.toUpperCase(),
        vehicleType: formData.vehicleType,
        capacity: parseFloat(formData.capacity),
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        yearMade: formData.yearMade ? parseInt(formData.yearMade) : undefined,
        driverId: formData.driverId || undefined,
      });

      if (result.success) {
        router.push('/vehicles');
      } else {
        alert(result.error || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm xe mới</h1>
          <p className="text-muted-foreground">Đăng ký xe tải vào hệ thống quản lý</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Thông tin xe
            </CardTitle>
            <CardDescription>Nhập đầy đủ thông tin xe tải</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Biển số xe *</Label>
                <Input
                  id="plateNumber"
                  placeholder="VD: 15C-12345"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Loại xe *</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => setFormData({ ...formData, vehicleType: value as 'CEMENT_TRUCK' | 'DUMP_TRUCK' | 'CONTAINER' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại xe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEMENT_TRUCK">Xe bồn xi măng</SelectItem>
                    <SelectItem value="DUMP_TRUCK">Xe ben / tải thường</SelectItem>
                    <SelectItem value="CONTAINER">Xe container</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Tải trọng (tấn) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 30"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearMade">Năm sản xuất</Label>
                <Input
                  id="yearMade"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  placeholder="VD: 2020"
                  value={formData.yearMade}
                  onChange={(e) => setFormData({ ...formData, yearMade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Hãng xe</Label>
                <Input
                  id="brand"
                  placeholder="VD: Howo, Dongfeng"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="VD: A7, KingLand"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverId">Lái xe phụ trách</Label>
              <Select
                value={formData.driverId}
                onValueChange={(value) => setFormData({ ...formData, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lái xe (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chưa gán lái xe</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.code} - {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/vehicles">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.plateNumber || !formData.capacity}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    Thêm xe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
