'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Navigation,
  Fuel,
  Banknote,
  Truck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import {
  getDailyData,
  quickAddTrip,
  quickAddFuel,
  quickAddAdvance,
  updateTripStatus,
  deleteTrip,
  deleteFuelTransaction,
} from './actions';

interface Driver {
  id: string;
  code: string;
  name: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
}

interface Route {
  id: string;
  code: string;
  name: string;
  distance: number;
  driverPay: number;
  mealAllowance: number;
}

interface CementType {
  id: string;
  code: string;
  name: string;
}

interface TripData {
  id: string;
  tripCode: string;
  status: string;
  vehicle: string;
  driver: string;
  route: string;
  quantity: number;
  createdAt: string;
}

interface FuelData {
  id: string;
  vehicle: string;
  driver: string;
  liters: number;
  amount: number;
  station: string;
  createdAt: string;
}

interface AdvanceData {
  id: string;
  driver: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

const tripStatusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ xuất', icon: <Clock className="h-3 w-3" /> },
  IN_TRANSIT: { color: 'bg-blue-100 text-blue-800', label: 'Đang chạy', icon: <Navigation className="h-3 w-3" /> },
  DELIVERED: { color: 'bg-green-100 text-green-800', label: 'Đã giao', icon: <CheckCircle className="h-3 w-3" /> },
  CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Hủy', icon: <XCircle className="h-3 w-3" /> },
};

export default function DailyOperationsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('trips');

  // Form states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cementTypes, setCementTypes] = useState<CementType[]>([]);

  // Data states
  const [todayTrips, setTodayTrips] = useState<TripData[]>([]);
  const [todayFuel, setTodayFuel] = useState<FuelData[]>([]);
  const [todayAdvances, setTodayAdvances] = useState<AdvanceData[]>([]);
  const [stats, setStats] = useState({
    tripCount: 0,
    totalQuantity: 0,
    fuelLiters: 0,
    fuelAmount: 0,
    advanceAmount: 0,
  });

  // Trip form
  const [tripForm, setTripForm] = useState({
    vehicleId: '',
    driverId: '',
    routeId: '',
    cementTypeId: '',
    quantity: '',
  });

  // Fuel form
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    driverId: '',
    liters: '',
    pricePerLiter: '24500',
    station: '',
    odometerReading: '',
  });

  // Advance form
  const [advanceForm, setAdvanceForm] = useState({
    driverId: '',
    amount: '',
    reason: '',
  });

  const [showTripDialog, setShowTripDialog] = useState(false);
  const [showFuelDialog, setShowFuelDialog] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDailyData(selectedDate);
      setDrivers(data.drivers);
      setVehicles(data.vehicles);
      setRoutes(data.routes);
      setCementTypes(data.cementTypes);
      setTodayTrips(data.trips);
      setTodayFuel(data.fuelTransactions);
      setTodayAdvances(data.advances);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleAddTrip = async () => {
    if (!tripForm.vehicleId || !tripForm.driverId || !tripForm.routeId || !tripForm.quantity) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      const result = await quickAddTrip({
        vehicleId: tripForm.vehicleId,
        driverId: tripForm.driverId,
        routeId: tripForm.routeId,
        cementTypeId: tripForm.cementTypeId || undefined,
        quantity: parseFloat(tripForm.quantity),
        tripDate: selectedDate,
      });

      if (result.success) {
        setTripForm({ vehicleId: '', driverId: '', routeId: '', cementTypeId: '', quantity: '' });
        setShowTripDialog(false);
        loadData();
      } else {
        alert(result.error || 'Lỗi khi thêm chuyến');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi thêm chuyến');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFuel = async () => {
    if (!fuelForm.vehicleId || !fuelForm.liters) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      const result = await quickAddFuel({
        vehicleId: fuelForm.vehicleId,
        driverId: fuelForm.driverId || undefined,
        liters: parseFloat(fuelForm.liters),
        pricePerLiter: parseFloat(fuelForm.pricePerLiter),
        station: fuelForm.station || undefined,
        odometerReading: fuelForm.odometerReading ? parseInt(fuelForm.odometerReading) : undefined,
        transactionDate: selectedDate,
      });

      if (result.success) {
        setFuelForm({ vehicleId: '', driverId: '', liters: '', pricePerLiter: '24500', station: '', odometerReading: '' });
        setShowFuelDialog(false);
        loadData();
      } else {
        alert(result.error || 'Lỗi khi thêm nhiên liệu');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi thêm nhiên liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdvance = async () => {
    if (!advanceForm.driverId || !advanceForm.amount) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      const result = await quickAddAdvance({
        driverId: advanceForm.driverId,
        amount: parseFloat(advanceForm.amount),
        reason: advanceForm.reason || undefined,
        advanceDate: selectedDate,
      });

      if (result.success) {
        setAdvanceForm({ driverId: '', amount: '', reason: '' });
        setShowAdvanceDialog(false);
        loadData();
      } else {
        alert(result.error || 'Lỗi khi thêm ứng lương');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi thêm ứng lương');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTripStatus = async (tripId: string, newStatus: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED') => {
    try {
      const result = await updateTripStatus(tripId, newStatus);
      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chuyến này?')) return;
    try {
      const result = await deleteTrip(tripId);
      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteFuel = async (fuelId: string) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    try {
      const result = await deleteFuelTransaction(fuelId);
      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nhập liệu hàng ngày</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chuyến hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tripCount}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(stats.totalQuantity)} tấn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nhiên liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.fuelLiters)} L</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.fuelAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ứng lương</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.advanceAmount)}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Thêm nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Dialog open={showTripDialog} onOpenChange={setShowTripDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1">
                    <Navigation className="mr-1 h-4 w-4" />
                    Chuyến
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm chuyến hàng</DialogTitle>
                    <DialogDescription>Nhập thông tin chuyến hàng mới</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Xe *</Label>
                      <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm({ ...tripForm, vehicleId: v })}>
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
                      <Select value={tripForm.driverId} onValueChange={(v) => setTripForm({ ...tripForm, driverId: v })}>
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
                      <Select value={tripForm.routeId} onValueChange={(v) => setTripForm({ ...tripForm, routeId: v })}>
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
                      <Select value={tripForm.cementTypeId} onValueChange={(v) => setTripForm({ ...tripForm, cementTypeId: v })}>
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
                        value={tripForm.quantity}
                        onChange={(e) => setTripForm({ ...tripForm, quantity: e.target.value })}
                        placeholder="VD: 30"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTripDialog(false)}>Hủy</Button>
                    <Button onClick={handleAddTrip} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Thêm chuyến
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showFuelDialog} onOpenChange={setShowFuelDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Fuel className="mr-1 h-4 w-4" />
                    Đổ dầu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ghi nhận đổ dầu</DialogTitle>
                    <DialogDescription>Nhập thông tin đổ nhiên liệu</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Xe *</Label>
                      <Select value={fuelForm.vehicleId} onValueChange={(v) => setFuelForm({ ...fuelForm, vehicleId: v })}>
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
                      <Select value={fuelForm.driverId} onValueChange={(v) => setFuelForm({ ...fuelForm, driverId: v })}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Số lít *</Label>
                        <Input
                          type="number"
                          value={fuelForm.liters}
                          onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                          placeholder="VD: 100"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Đơn giá</Label>
                        <Input
                          type="number"
                          value={fuelForm.pricePerLiter}
                          onChange={(e) => setFuelForm({ ...fuelForm, pricePerLiter: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Trạm xăng</Label>
                      <Input
                        value={fuelForm.station}
                        onChange={(e) => setFuelForm({ ...fuelForm, station: e.target.value })}
                        placeholder="VD: Petrolimex Cầu Rào"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Số km đồng hồ</Label>
                      <Input
                        type="number"
                        value={fuelForm.odometerReading}
                        onChange={(e) => setFuelForm({ ...fuelForm, odometerReading: e.target.value })}
                        placeholder="VD: 125000"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowFuelDialog(false)}>Hủy</Button>
                    <Button onClick={handleAddFuel} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Ghi nhận
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Banknote className="mr-1 h-4 w-4" />
                    Ứng lương
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ghi nhận ứng lương</DialogTitle>
                    <DialogDescription>Nhập thông tin ứng lương cho lái xe</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Lái xe *</Label>
                      <Select value={advanceForm.driverId} onValueChange={(v) => setAdvanceForm({ ...advanceForm, driverId: v })}>
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
                      <Label>Số tiền *</Label>
                      <Input
                        type="number"
                        value={advanceForm.amount}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                        placeholder="VD: 2000000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Lý do</Label>
                      <Textarea
                        value={advanceForm.reason}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                        placeholder="VD: Tiền ăn, tiền xăng..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>Hủy</Button>
                    <Button onClick={handleAddAdvance} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Ghi nhận
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trips">
            <Navigation className="mr-2 h-4 w-4" />
            Chuyến hàng ({todayTrips.length})
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="mr-2 h-4 w-4" />
            Nhiên liệu ({todayFuel.length})
          </TabsTrigger>
          <TabsTrigger value="advances">
            <Banknote className="mr-2 h-4 w-4" />
            Ứng lương ({todayAdvances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách chuyến hàng</CardTitle>
                <Button onClick={() => setShowTripDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chuyến
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có chuyến hàng nào. Bấm "Thêm chuyến" để bắt đầu.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Xe</TableHead>
                      <TableHead>Lái xe</TableHead>
                      <TableHead>Tuyến</TableHead>
                      <TableHead className="text-right">Khối lượng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-mono text-sm">{trip.tripCode}</TableCell>
                        <TableCell>{trip.vehicle}</TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>{trip.route}</TableCell>
                        <TableCell className="text-right">{formatNumber(trip.quantity)} tấn</TableCell>
                        <TableCell>
                          <Select
                            value={trip.status}
                            onValueChange={(v) => handleUpdateTripStatus(trip.id, v as 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED')}
                          >
                            <SelectTrigger className="w-32">
                              <Badge className={tripStatusConfig[trip.status]?.color}>
                                {tripStatusConfig[trip.status]?.icon}
                                <span className="ml-1">{tripStatusConfig[trip.status]?.label}</span>
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Chờ xuất</SelectItem>
                              <SelectItem value="IN_TRANSIT">Đang chạy</SelectItem>
                              <SelectItem value="DELIVERED">Đã giao</SelectItem>
                              <SelectItem value="CANCELLED">Hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="ghost" asChild>
                              <Link href={`/trips/${trip.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Giao dịch nhiên liệu</CardTitle>
                <Button onClick={() => setShowFuelDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm giao dịch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayFuel.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có giao dịch nhiên liệu nào.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xe</TableHead>
                      <TableHead>Lái xe</TableHead>
                      <TableHead className="text-right">Số lít</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead>Trạm</TableHead>
                      <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayFuel.map((fuel) => (
                      <TableRow key={fuel.id}>
                        <TableCell>{fuel.vehicle}</TableCell>
                        <TableCell>{fuel.driver || '-'}</TableCell>
                        <TableCell className="text-right">{formatNumber(fuel.liters)} L</TableCell>
                        <TableCell className="text-right">{formatCurrency(fuel.amount)}</TableCell>
                        <TableCell>{fuel.station || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="ghost" asChild>
                              <Link href={`/fuel/${fuel.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteFuel(fuel.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ứng lương lái xe</CardTitle>
                <Button onClick={() => setShowAdvanceDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ứng lương
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayAdvances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có ứng lương nào.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lái xe</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAdvances.map((advance) => (
                      <TableRow key={advance.id}>
                        <TableCell>{advance.driver}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(advance.amount)}</TableCell>
                        <TableCell>{advance.reason || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={advance.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {advance.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
