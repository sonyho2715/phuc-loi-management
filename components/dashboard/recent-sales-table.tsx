'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/formatters';

interface Sale {
  id: string;
  date: Date;
  customer: string;
  cementType: string;
  quantity: number;
  amount: number;
  status: string;
}

interface RecentSalesTableProps {
  sales: Sale[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Đã thanh toán</Badge>;
    case 'PARTIAL':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Một phần</Badge>;
    case 'UNPAID':
      return <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">Chưa thanh toán</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có dữ liệu giao dịch
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Loại XM</TableHead>
            <TableHead className="text-right">Số lượng</TableHead>
            <TableHead className="text-right">Thành tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(sale.date)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/customers/${sale.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {sale.customer}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{sale.cementType}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatQuantity(sale.quantity)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(sale.amount)}
              </TableCell>
              <TableCell>{getStatusBadge(sale.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
