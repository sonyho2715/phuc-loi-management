'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { customerSchema, CustomerFormData, customerTypeOptions } from '@/lib/validations/customer';
import { createCustomer, updateCustomer } from '@/app/(dashboard)/customers/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CustomerFormProps {
  customer?: {
    id: string;
    companyName: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxCode: string | null;
    customerType: string;
    creditLimit: number | string | { toNumber: () => number };
    paymentTerms: number;
    notes: string | null;
    isActive: boolean;
  };
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customer;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: customer?.companyName || '',
      contactPerson: customer?.contactPerson || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      taxCode: customer?.taxCode || '',
      customerType: (customer?.customerType as CustomerFormData['customerType']) || 'MIXING_STATION',
      creditLimit: typeof customer?.creditLimit === 'object' && 'toNumber' in customer.creditLimit
        ? customer.creditLimit.toNumber()
        : Number(customer?.creditLimit || 0),
      paymentTerms: customer?.paymentTerms || 30,
      notes: customer?.notes || '',
      isActive: customer?.isActive ?? true,
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const result = isEditing
        ? await updateCustomer(customer.id, data)
        : await createCustomer(data);

      if (result.success) {
        toast.success(isEditing ? 'Đã cập nhật khách hàng' : 'Đã tạo khách hàng mới');
        router.push('/customers');
        router.refresh();
      } else {
        toast.error(result.error || 'Đã xảy ra lỗi');
      }
    } catch {
      toast.error('Đã xảy ra lỗi');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên công ty *</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Trạm trộn bê tông Đình Vũ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại khách hàng</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại khách hàng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customerTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Người liên hệ</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Nguyễn Văn An" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input placeholder="VD: 0912345678" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="VD: contact@company.vn"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã số thuế</FormLabel>
                <FormControl>
                  <Input placeholder="VD: 0200123456" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="creditLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hạn mức tín dụng (VND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="VD: 500000000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Công nợ tối đa cho phép</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số ngày cho nợ</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="VD: 30"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Số ngày kể từ ngày mua hàng</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Khu công nghiệp Đình Vũ, Hải Phòng"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ghi chú về khách hàng..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                <FormDescription>
                  Khách hàng đang hoạt động sẽ hiển thị trong danh sách
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Cập nhật' : 'Tạo khách hàng'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  );
}
