'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Truck, User, MapPin, Package, Loader2 } from 'lucide-react';
import { createTrip, getDispatchData } from '../actions';

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  capacity: number;
  driver: { id: string; name: string } | null;
}

interface Driver {
  id: string;
  code: string;
  name: string;
  phone: string | null;
}

interface Route {
  id: string;
  code: string;
  name: string;
  fromAddress: string | null;
  toAddress: string | null;
  distance: number;
  fuelAllowance: number;
  driverPay: number;
  mealAllowance: number;
  tollFee: number;
}

interface CementType {
  id: string;
  code: string;
  name: string;
}

interface DispatchData {
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  cementTypes: CementType[];
}

export default function AddTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<DispatchData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    routeId: '',
    cementTypeId: '',
    quantity: '',
    deliveryNote: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getDispatchData();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to load dispatch data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-select driver when vehicle is selected
  useEffect(() => {
    if (formData.vehicleId && data) {
      const vehicle = data.vehicles.find(v => v.id === formData.vehicleId);
      if (vehicle?.driver) {
        setFormData(prev => ({ ...prev, driverId: vehicle.driver!.id }));
      }
    }
  }, [formData.vehicleId, data]);

  // Update selected route for cost preview
  useEffect(() => {
    if (formData.routeId && data) {
      const route = data.routes.find(r => r.id === formData.routeId);
      setSelectedRoute(route || null);
    } else {
      setSelectedRoute(null);
    }
  }, [formData.routeId, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createTrip({
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        routeId: formData.routeId,
        cementTypeId: formData.cementTypeId,
        quantity: parseFloat(formData.quantity),
        deliveryNote: formData.deliveryNote || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        router.push('/trips');
      } else {
        alert(result.error || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip');
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
          <Link href="/trips">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tạo chuyến hàng mới</h1>
          <p className="text-muted-foreground">Điều phối xe và lái xe cho chuyến giao hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Thông tin chuyến
              </CardTitle>
              <CardDescription>Chọn xe, lái xe và tuyến đường</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Xe tải *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.vehicleType} ({vehicle.capacity}T)
                        {vehicle.driver && ` - ${vehicle.driver.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Lái xe *</Label>
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lái xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.code} - {driver.name} ({driver.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeId">Tuyến đường *</Label>
                <Select
                  value={formData.routeId}
                  onValueChange={(value) => setFormData({ ...formData, routeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tuyến đường" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.code} - {route.name} ({route.distance}km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cementTypeId">Loại xi măng *</Label>
                <Select
                  value={formData.cementTypeId}
                  onValueChange={(value) => setFormData({ ...formData, cementTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại xi măng" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.cementTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.code} - {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng (tấn) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 30"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNote">Số phiếu giao hàng</Label>
                <Input
                  id="deliveryNote"
                  placeholder="VD: PGH-20240115-001"
                  value={formData.deliveryNote}
                  onChange={(e) => setFormData({ ...formData, deliveryNote: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm về chuyến hàng..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Cost Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Chi phí định mức
                </CardTitle>
                <CardDescription>
                  Dựa trên tuyến đường được chọn
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRoute ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">{selectedRoute.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedRoute.fromAddress || 'N/A'} → {selectedRoute.toAddress || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Khoảng cách: {selectedRoute.distance} km
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Định mức dầu</p>
                        <p className="text-lg font-bold text-blue-600">
                          {selectedRoute.fuelAllowance} lít
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tiền công lái xe</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedRoute.driverPay)}
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Tiền ăn</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(selectedRoute.mealAllowance)}
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Phí đường</p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatCurrency(selectedRoute.tollFee)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tổng chi phí định mức</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(
                          selectedRoute.driverPay +
                          selectedRoute.mealAllowance +
                          selectedRoute.tollFee +
                          (selectedRoute.fuelAllowance * 24500) // Estimated fuel cost
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (Dầu tính theo giá 24,500đ/lít)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chọn tuyến đường để xem chi phí định mức</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/trips">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.vehicleId || !formData.driverId || !formData.routeId || !formData.cementTypeId || !formData.quantity}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Tạo chuyến hàng
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
