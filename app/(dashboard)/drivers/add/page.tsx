'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, User, Loader2, CreditCard, Phone, IdCard, MapPin } from 'lucide-react';
import { createDriver } from '../actions';

export default function AddDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    idNumber: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    bankAccount: '',
    bankName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createDriver({
        code: formData.code.toUpperCase(),
        name: formData.name,
        phone: formData.phone || undefined,
        idNumber: formData.idNumber || undefined,
        address: formData.address || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry) : undefined,
        bankAccount: formData.bankAccount || undefined,
        bankName: formData.bankName || undefined,
      });

      if (result.success) {
        router.push('/drivers');
      } else {
        alert(result.error || 'Không thể tạo lái xe');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Không thể tạo lái xe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/drivers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm lái xe mới</h1>
          <p className="text-muted-foreground">Đăng ký lái xe vào hệ thống quản lý</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>Thông tin cơ bản của lái xe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã lái xe *</Label>
                  <Input
                    id="code"
                    placeholder="VD: LX001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    placeholder="VD: 0901234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="flex items-center gap-1">
                    <IdCard className="h-3 w-3" />
                    Số CCCD/CMND
                  </Label>
                  <Input
                    id="idNumber"
                    placeholder="VD: 001234567890"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Địa chỉ
                </Label>
                <Textarea
                  id="address"
                  placeholder="VD: Số 123, Đường ABC, Quận XYZ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - License & Bank Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Giấy phép lái xe
                </CardTitle>
                <CardDescription>Thông tin bằng lái</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Số bằng lái</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="VD: 012345678"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">Ngày hết hạn</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thông tin ngân hàng
                </CardTitle>
                <CardDescription>Tài khoản nhận lương</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Tên ngân hàng</Label>
                  <Input
                    id="bankName"
                    placeholder="VD: Vietcombank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Số tài khoản</Label>
                  <Input
                    id="bankAccount"
                    placeholder="VD: 1234567890"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/drivers">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.code || !formData.name}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Thêm lái xe
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
