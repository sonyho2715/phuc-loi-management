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
import { ArrowLeft, Fuel, Loader2, AlertTriangle } from 'lucide-react';
import { getFuelFormData, createFuelTransaction } from '../actions';

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
}

interface FuelStation {
  id: string;
  name: string;
  address: string | null;
}

interface Trip {
  id: string;
  tripCode: string;
  vehiclePlate: string;
  routeName: string;
  fuelAllowance: number;
}

interface FormData {
  vehicles: Vehicle[];
  fuelStations: FuelStation[];
  recentTrips: Trip[];
}

export default function AddFuelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<FormData | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    fuelStationId: '',
    tripId: '',
    liters: '',
    pricePerLiter: '24500',
    paymentMethod: 'COMPANY_ACCOUNT' as 'COMPANY_ACCOUNT' | 'CASH' | 'DRIVER_ADVANCE',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getFuelFormData();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  // Update selected trip when trip is selected
  useEffect(() => {
    if (formData.tripId && data) {
      const trip = data.recentTrips.find(t => t.id === formData.tripId);
      setSelectedTrip(trip || null);

      // Auto-select vehicle from trip
      if (trip) {
        const vehicle = data.vehicles.find(v => v.plateNumber === trip.vehiclePlate);
        if (vehicle) {
          setFormData(prev => ({ ...prev, vehicleId: vehicle.id }));
        }
      }
    } else {
      setSelectedTrip(null);
    }
  }, [formData.tripId, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createFuelTransaction({
        vehicleId: formData.vehicleId,
        fuelStationId: formData.fuelStationId,
        tripId: formData.tripId || undefined,
        liters: parseFloat(formData.liters),
        pricePerLiter: parseFloat(formData.pricePerLiter),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        router.push('/fuel');
      } else {
        alert(result.error || 'Failed to record fuel');
      }
    } catch (error) {
      console.error('Error recording fuel:', error);
      alert('Failed to record fuel');
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

  const liters = parseFloat(formData.liters) || 0;
  const pricePerLiter = parseFloat(formData.pricePerLiter) || 0;
  const totalAmount = liters * pricePerLiter;
  const isOverLimit = selectedTrip && liters > selectedTrip.fuelAllowance;
  const overage = isOverLimit ? liters - selectedTrip!.fuelAllowance : 0;

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
          <Link href="/fuel">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ghi nhận đổ dầu</h1>
          <p className="text-muted-foreground">Nhập thông tin giao dịch đổ dầu cho xe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Thông tin đổ dầu
              </CardTitle>
              <CardDescription>Nhập chi tiết giao dịch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tripId">Liên kết chuyến hàng (tùy chọn)</Label>
                <Select
                  value={formData.tripId}
                  onValueChange={(value) => setFormData({ ...formData, tripId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyến hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không liên kết</SelectItem>
                    {data?.recentTrips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.tripCode} - {trip.vehiclePlate} ({trip.routeName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleId">Xe *</Label>
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
                        {vehicle.plateNumber} - {vehicle.vehicleType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelStationId">Trạm xăng *</Label>
                <Select
                  value={formData.fuelStationId}
                  onValueChange={(value) => setFormData({ ...formData, fuelStationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạm xăng" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.fuelStations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="liters">Số lít *</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="VD: 100"
                    value={formData.liters}
                    onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerLiter">Đơn giá (đ/lít) *</Label>
                  <Input
                    id="pricePerLiter"
                    type="number"
                    step="100"
                    min="0"
                    placeholder="VD: 24500"
                    value={formData.pricePerLiter}
                    onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Hình thức thanh toán *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as 'COMPANY_ACCOUNT' | 'CASH' | 'DRIVER_ADVANCE' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY_ACCOUNT">Tài khoản công ty</SelectItem>
                    <SelectItem value="CASH">Tiền mặt</SelectItem>
                    <SelectItem value="DRIVER_ADVANCE">Lái xe ứng trước</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Mã hóa đơn / Số phiếu</Label>
                <Input
                  id="reference"
                  placeholder="VD: HD-001234"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tổng kết</CardTitle>
                <CardDescription>Xem trước giao dịch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Số lít</p>
                      <p className="text-xl font-bold">{liters || 0} L</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Đơn giá</p>
                      <p className="text-xl font-bold">{formatCurrency(pricePerLiter)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Thành tiền</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </div>

                {selectedTrip && (
                  <div className={`p-4 rounded-lg ${isOverLimit ? 'bg-red-100' : 'bg-green-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isOverLimit ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Fuel className="h-5 w-5 text-green-600" />
                      )}
                      <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverLimit ? 'Vượt định mức!' : 'Trong định mức'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>Định mức: {selectedTrip.fuelAllowance} lít</p>
                      <p>Thực đổ: {liters} lít</p>
                      {isOverLimit && (
                        <p className="text-red-600 font-medium">
                          Vượt: {overage.toFixed(1)} lít ({formatCurrency(overage * pricePerLiter)})
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/fuel">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.vehicleId || !formData.fuelStationId || !formData.liters || !formData.pricePerLiter}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Fuel className="mr-2 h-4 w-4" />
                    Ghi nhận
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
