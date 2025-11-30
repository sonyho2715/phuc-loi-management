'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Loader2, Calculator } from 'lucide-react';
import { getRouteFormData, createRoute } from '../actions';

interface Factory {
  id: string;
  name: string;
  code: string;
}

interface Customer {
  id: string;
  companyName: string;
  shortName: string | null;
}

interface FormData {
  factories: Factory[];
  customers: Customer[];
}

export default function AddRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<FormData | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    fromAddress: '',
    toAddress: '',
    distance: '',
    fuelAllowance: '',
    driverPay: '',
    mealAllowance: '50000',
    tollFee: '0',
    factoryId: '',
    customerId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getRouteFormData();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createRoute({
        code: formData.code.toUpperCase(),
        name: formData.name,
        fromAddress: formData.fromAddress || undefined,
        toAddress: formData.toAddress || undefined,
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        fuelAllowance: parseFloat(formData.fuelAllowance),
        driverPay: parseFloat(formData.driverPay),
        mealAllowance: parseFloat(formData.mealAllowance),
        tollFee: parseFloat(formData.tollFee),
        factoryId: formData.factoryId || undefined,
        customerId: formData.customerId || undefined,
      });

      if (result.success) {
        router.push('/routes');
      } else {
        alert(result.error || 'Không thể tạo tuyến đường');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Không thể tạo tuyến đường');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total cost per trip
  const fuelAllowance = parseFloat(formData.fuelAllowance) || 0;
  const driverPay = parseFloat(formData.driverPay) || 0;
  const mealAllowance = parseFloat(formData.mealAllowance) || 0;
  const tollFee = parseFloat(formData.tollFee) || 0;
  const fuelPrice = 24500; // Average fuel price
  const estimatedFuelCost = fuelAllowance * fuelPrice;
  const totalCostPerTrip = estimatedFuelCost + driverPay + mealAllowance + tollFee;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm tuyến đường mới</h1>
          <p className="text-muted-foreground">Tạo tuyến đường và cấu hình chi phí vận chuyển</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Route Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Thông tin tuyến đường
              </CardTitle>
              <CardDescription>Nhập thông tin cơ bản của tuyến</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã tuyến *</Label>
                  <Input
                    id="code"
                    placeholder="VD: HP-HN"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên tuyến *</Label>
                  <Input
                    id="name"
                    placeholder="VD: Hải Phòng - Hà Nội"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromAddress">Điểm đi</Label>
                <Input
                  id="fromAddress"
                  placeholder="VD: Nhà máy Xi măng Hải Phòng"
                  value={formData.fromAddress}
                  onChange={(e) => setFormData({ ...formData, fromAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toAddress">Điểm đến</Label>
                <Input
                  id="toAddress"
                  placeholder="VD: Trạm trộn ABC - Hà Nội"
                  value={formData.toAddress}
                  onChange={(e) => setFormData({ ...formData, toAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Khoảng cách (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 120"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="factoryId">Nhà máy xuất</Label>
                  <Select
                    value={formData.factoryId}
                    onValueChange={(value) => setFormData({ ...formData, factoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà máy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không chọn</SelectItem>
                      {data?.factories.map((factory) => (
                        <SelectItem key={factory.id} value={factory.id}>
                          {factory.code} - {factory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerId">Khách hàng</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không chọn</SelectItem>
                      {data?.customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.shortName || customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Cost Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cấu hình chi phí
                </CardTitle>
                <CardDescription>Định mức chi phí cho mỗi chuyến</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fuelAllowance">Định mức dầu (lít) *</Label>
                    <Input
                      id="fuelAllowance"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="VD: 80"
                      value={formData.fuelAllowance}
                      onChange={(e) => setFormData({ ...formData, fuelAllowance: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPay">Tiền công lái xe (đ) *</Label>
                    <Input
                      id="driverPay"
                      type="number"
                      step="10000"
                      min="0"
                      placeholder="VD: 500000"
                      value={formData.driverPay}
                      onChange={(e) => setFormData({ ...formData, driverPay: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mealAllowance">Tiền ăn (đ)</Label>
                    <Input
                      id="mealAllowance"
                      type="number"
                      step="10000"
                      min="0"
                      placeholder="VD: 50000"
                      value={formData.mealAllowance}
                      onChange={(e) => setFormData({ ...formData, mealAllowance: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tollFee">Phí cầu đường (đ)</Label>
                    <Input
                      id="tollFee"
                      type="number"
                      step="10000"
                      min="0"
                      placeholder="VD: 100000"
                      value={formData.tollFee}
                      onChange={(e) => setFormData({ ...formData, tollFee: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng chi phí ước tính / chuyến</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiền dầu ({fuelAllowance} lít × {formatCurrency(fuelPrice)})</span>
                  <span>{formatCurrency(estimatedFuelCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiền công lái xe</span>
                  <span>{formatCurrency(driverPay)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiền ăn</span>
                  <span>{formatCurrency(mealAllowance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí cầu đường</span>
                  <span>{formatCurrency(tollFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatCurrency(totalCostPerTrip)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/routes">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.code || !formData.name || !formData.fuelAllowance || !formData.driverPay}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Tạo tuyến đường
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
