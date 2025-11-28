import { z } from 'zod';

export const customerSchema = z.object({
  companyName: z.string().min(1, 'Tên công ty là bắt buộc').max(200),
  contactPerson: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  taxCode: z.string().max(20).optional().nullable(),
  customerType: z.enum(['MIXING_STATION', 'RESELLER', 'PROJECT', 'OTHER']),
  creditLimit: z.coerce.number().min(0, 'Hạn mức phải >= 0'),
  paymentTerms: z.coerce.number().min(0).max(365),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const customerTypeOptions = [
  { value: 'MIXING_STATION', label: 'Trạm trộn bê tông' },
  { value: 'RESELLER', label: 'Đại lý' },
  { value: 'PROJECT', label: 'Dự án' },
  { value: 'OTHER', label: 'Khác' },
] as const;
