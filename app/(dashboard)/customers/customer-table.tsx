'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate, formatPhone, getCustomerTypeLabel } from '@/lib/formatters';
import { MoreHorizontal, Eye, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { deleteCustomer } from './actions';
import { toast } from 'sonner';

// Import AlertDialog component
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

// Simple Alert Dialog components
const AlertDialogComponent = AlertDialogPrimitive.Root;
const AlertDialogTriggerComponent = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlayComponent = AlertDialogPrimitive.Overlay;
const AlertDialogContentComponent = AlertDialogPrimitive.Content;
const AlertDialogTitleComponent = AlertDialogPrimitive.Title;
const AlertDialogDescriptionComponent = AlertDialogPrimitive.Description;
const AlertDialogCancelComponent = AlertDialogPrimitive.Cancel;
const AlertDialogActionComponent = AlertDialogPrimitive.Action;

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  customerType: string;
  creditLimit: number | string | { toNumber: () => number };
  totalDebt: number;
  lastSaleDate: Date | null;
  salesCount: number;
}

interface CustomerTableProps {
  customers: Customer[];
}

function getCustomerTypeBadge(type: string) {
  const colors: Record<string, string> = {
    MIXING_STATION: 'bg-blue-100 text-blue-800',
    RESELLER: 'bg-purple-100 text-purple-800',
    PROJECT: 'bg-green-100 text-green-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge variant="secondary" className={colors[type] || colors.OTHER}>
      {getCustomerTypeLabel(type)}
    </Badge>
  );
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteCustomer(deleteId);
      if (result.success) {
        toast.success('Đã xóa khách hàng');
        router.refresh();
      } else {
        toast.error(result.error || 'Không thể xóa khách hàng');
      }
    } catch {
      toast.error('Đã xảy ra lỗi');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Chưa có khách hàng nào</p>
        <Button asChild className="mt-4">
          <Link href="/customers/add">Thêm khách hàng đầu tiên</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Công ty</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Công nợ</TableHead>
              <TableHead className="text-right">Số đơn</TableHead>
              <TableHead>Mua gần nhất</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {customer.companyName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {customer.contactPerson && (
                      <p className="text-sm">{customer.contactPerson}</p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(customer.phone)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getCustomerTypeBadge(customer.customerType)}</TableCell>
                <TableCell className="text-right">
                  <span className={customer.totalDebt > 0 ? 'text-red-600 font-medium' : ''}>
                    {formatCurrency(customer.totalDebt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">{customer.salesCount}</TableCell>
                <TableCell>
                  {customer.lastSaleDate
                    ? formatDate(customer.lastSaleDate)
                    : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/customers/${customer.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(customer.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialogComponent open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogPortal>
          <AlertDialogOverlayComponent className="fixed inset-0 z-50 bg-black/80" />
          <AlertDialogContentComponent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <AlertDialogTitleComponent className="text-lg font-semibold">
                Xác nhận xóa
              </AlertDialogTitleComponent>
              <AlertDialogDescriptionComponent className="text-sm text-muted-foreground">
                Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.
              </AlertDialogDescriptionComponent>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <AlertDialogCancelComponent asChild>
                <Button variant="outline" disabled={isDeleting}>
                  Hủy
                </Button>
              </AlertDialogCancelComponent>
              <AlertDialogActionComponent asChild>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </AlertDialogActionComponent>
            </div>
          </AlertDialogContentComponent>
        </AlertDialogPortal>
      </AlertDialogComponent>
    </>
  );
}
