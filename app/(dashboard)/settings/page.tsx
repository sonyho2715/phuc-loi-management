import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  User,
  Building,
  Bell,
  Shield,
  Database,
} from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Badge className="bg-purple-100 text-purple-800">Chủ sở hữu</Badge>;
      case 'ACCOUNTANT':
        return <Badge className="bg-blue-100 text-blue-800">Kế toán</Badge>;
      case 'SALES':
        return <Badge className="bg-green-100 text-green-800">Kinh doanh</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Xem</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý cài đặt tài khoản và hệ thống
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Quản lý thông tin cá nhân của bạn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue={session.user?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={session.user?.email || ''} disabled />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label>Vai trò:</Label>
              {getRoleBadge(session.user?.role || 'VIEWER')}
            </div>
            <Button>Lưu thay đổi</Button>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Thông tin công ty</CardTitle>
                <CardDescription>Cài đặt thông tin doanh nghiệp</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Tên công ty</Label>
                <Input id="company" defaultValue="Công ty TNHH Phúc Lợi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxCode">Mã số thuế</Label>
                <Input id="taxCode" placeholder="0123456789" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" defaultValue="Hải Phòng, Việt Nam" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" placeholder="0225 xxx xxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email công ty</Label>
                <Input id="companyEmail" placeholder="info@phucloi.vn" />
              </div>
            </div>
            <Button>Lưu thay đổi</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>Cài đặt thông báo hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thông báo công nợ quá hạn</p>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có công nợ quá hạn</p>
              </div>
              <Button variant="outline" size="sm">Bật</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Báo cáo hàng ngày</p>
                <p className="text-sm text-muted-foreground">Nhận email tổng kết cuối ngày</p>
              </div>
              <Button variant="outline" size="sm">Tắt</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cảnh báo tồn kho</p>
                <p className="text-sm text-muted-foreground">Thông báo khi số lượng thấp</p>
              </div>
              <Button variant="outline" size="sm">Bật</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
            <Button>Đổi mật khẩu</Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Thông tin hệ thống</CardTitle>
                <CardDescription>Thông tin phiên bản và trạng thái</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Phiên bản</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="font-medium">PostgreSQL (Railway)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hosting</p>
                <p className="font-medium">Vercel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
