import { format, formatDistance, formatRelative } from 'date-fns';
import { vi } from 'date-fns/locale';

// Vietnamese currency formatter (VND)
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0 đ';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 đ';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

// Format number with Vietnamese separators (dots for thousands)
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  return new Intl.NumberFormat('vi-VN').format(n);
}

// Format quantity (for cement tons)
export function formatQuantity(quantity: number | string | null | undefined, unit: string = 'tấn'): string {
  if (quantity === null || quantity === undefined) return `0 ${unit}`;
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  if (isNaN(num)) return `0 ${unit}`;

  return `${new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)} ${unit}`;
}

// Format date in Vietnamese format
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return format(d, 'dd/MM/yyyy', { locale: vi });
}

// Format date with time
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
}

// Format relative time in Vietnamese
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return formatDistance(d, new Date(), { addSuffix: true, locale: vi });
}

// Format date relative to now in Vietnamese
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return formatRelative(d, new Date(), { locale: vi });
}

// Parse Vietnamese currency string to number
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove currency symbol, dots (thousand separators), and replace comma with dot
  const cleaned = value
    .replace(/[đĐ₫VND\s]/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Format phone number
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Format Vietnamese phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Calculate days overdue
export function calculateDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

// Get debt status badge color
export function getDebtStatusColor(daysOverdue: number): string {
  if (daysOverdue === 0) return 'bg-green-100 text-green-800';
  if (daysOverdue <= 30) return 'bg-yellow-100 text-yellow-800';
  if (daysOverdue <= 60) return 'bg-orange-100 text-orange-800';
  if (daysOverdue <= 90) return 'bg-red-100 text-red-800';
  return 'bg-red-200 text-red-900';
}

// Get payment status label in Vietnamese
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PARTIAL: 'Thanh toán một phần',
    UNPAID: 'Chưa thanh toán',
  };
  return labels[status] || status;
}

// Get debt status label in Vietnamese
export function getDebtStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CURRENT: 'Trong hạn',
    OVERDUE: 'Quá hạn',
    PAID: 'Đã trả',
  };
  return labels[status] || status;
}

// Get customer type label in Vietnamese
export function getCustomerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MIXING_STATION: 'Trạm trộn bê tông',
    RESELLER: 'Đại lý',
    PROJECT: 'Dự án',
    OTHER: 'Khác',
  };
  return labels[type] || type;
}

// Get user role label in Vietnamese
export function getUserRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Chủ doanh nghiệp',
    ACCOUNTANT: 'Kế toán',
    SALES: 'Nhân viên kinh doanh',
    VIEWER: 'Xem',
  };
  return labels[role] || role;
}
