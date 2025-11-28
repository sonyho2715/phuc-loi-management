'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Building,
  Package,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Bot,
  FileText,
  Settings,
  LogOut,
  ChevronUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    group: 'Tổng quan',
    items: [
      { title: 'Bảng điều khiển', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Khách hàng & Đối tác',
    items: [
      { title: 'Khách hàng', href: '/customers', icon: Users },
      { title: 'Nhà cung cấp', href: '/suppliers', icon: Building },
    ],
  },
  {
    group: 'Kho hàng',
    items: [
      { title: 'Tổng quan kho', href: '/inventory', icon: Package },
      { title: 'Nhập hàng', href: '/inventory/purchases', icon: TrendingDown },
      { title: 'Xuất hàng', href: '/inventory/sales', icon: TrendingUp },
    ],
  },
  {
    group: 'Công nợ',
    items: [
      { title: 'Tổng quan công nợ', href: '/debts', icon: Wallet },
      { title: 'Phải thu', href: '/debts/receivables', icon: Receipt },
      { title: 'Phải trả', href: '/debts/payables', icon: CreditCard },
    ],
  },
  {
    group: 'Công cụ',
    items: [
      { title: 'Trợ lý AI', href: '/ai-assistant', icon: Bot },
      { title: 'Báo cáo', href: '/reports', icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Phúc Lợi</h2>
            <p className="text-xs text-muted-foreground">Xi măng rời</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className={cn(
                            'h-4 w-4',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {session?.user?.name ? getUserInitials(session.user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {session?.user?.name || 'Người dùng'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
