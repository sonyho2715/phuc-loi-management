import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCustomer } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  getCustomerTypeLabel,
  getPaymentStatusLabel,
  formatQuantity,
} from '@/lib/formatters';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Calendar,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{getCustomerTypeLabel(customer.customerType)}</Badge>
              {!customer.isActive && (
                <Badge variant="secondary">Không hoạt động</Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${customer.totalDebt > 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(customer.totalDebt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng mua hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(customer.totalPurchases)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hạn mức tín dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(Number(customer.creditLimit))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số ngày cho nợ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.paymentTerms} ngày</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Info & Tabs */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.contactPerson && (
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Người liên hệ</p>
                  <p className="text-sm text-muted-foreground">{customer.contactPerson}</p>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Điện thoại</p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {formatPhone(customer.phone)}
                  </a>
                </div>
              </div>
            )}

            {customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Địa chỉ</p>
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                </div>
              </div>
            )}

            {customer.taxCode && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mã số thuế</p>
                  <p className="text-sm text-muted-foreground">{customer.taxCode}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ngày tạo</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>

            {customer.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-1">Ghi chú</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">Lịch sử mua hàng</TabsTrigger>
              <TabsTrigger value="debts">Công nợ</TabsTrigger>
              <TabsTrigger value="interactions">Ghi chú</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử mua hàng</CardTitle>
                  <CardDescription>20 đơn hàng gần nhất</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer.sales.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Chưa có giao dịch nào
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Loại XM</TableHead>
                          <TableHead className="text-right">Số lượng</TableHead>
                          <TableHead className="text-right">Thành tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.saleDate)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{sale.cementType.code}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatQuantity(Number(sale.quantity))}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(sale.totalAmount))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  sale.paymentStatus === 'PAID'
                                    ? 'default'
                                    : sale.paymentStatus === 'PARTIAL'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className={
                                  sale.paymentStatus === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : sale.paymentStatus === 'PARTIAL'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {getPaymentStatusLabel(sale.paymentStatus)}
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

            <TabsContent value="debts">
              <Card>
                <CardHeader>
                  <CardTitle>Công nợ hiện tại</CardTitle>
                  <CardDescription>Các khoản nợ chưa thanh toán</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer.receivables.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Không có công nợ
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Đến hạn</TableHead>
                          <TableHead className="text-right">Số tiền gốc</TableHead>
                          <TableHead className="text-right">Đã trả</TableHead>
                          <TableHead className="text-right">Còn nợ</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.receivables.map((debt) => {
                          const isOverdue = new Date(debt.dueDate) < new Date();
                          return (
                            <TableRow key={debt.id}>
                              <TableCell>{formatDate(debt.transactionDate)}</TableCell>
                              <TableCell className={isOverdue ? 'text-red-600' : ''}>
                                {formatDate(debt.dueDate)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(Number(debt.originalAmount))}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(Number(debt.paidAmount))}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                {formatCurrency(Number(debt.remainingAmount))}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    debt.status === 'OVERDUE'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }
                                >
                                  {debt.status === 'OVERDUE' ? 'Quá hạn' : 'Trong hạn'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử tương tác</CardTitle>
                  <CardDescription>Ghi chú và lịch sử liên hệ</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer.interactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Chưa có ghi chú nào
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {customer.interactions.map((interaction) => (
                        <div key={interaction.id} className="border-l-2 pl-4 py-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{interaction.type}</Badge>
                            <span>{formatDate(interaction.interactionDate)}</span>
                          </div>
                          <p className="mt-1 text-sm">{interaction.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
