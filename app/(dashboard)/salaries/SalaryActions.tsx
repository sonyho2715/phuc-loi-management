'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, CheckCircle, Banknote, Loader2, RefreshCw } from 'lucide-react';
import { calculateAllSalaries, confirmSalary, paySalary } from './actions';

interface SalaryActionsProps {
  month: number;
  year: number;
}

export function SalaryActions({ month, year }: SalaryActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const handleCalculateAll = async () => {
    setLoading(true);
    setAction('calculate');
    try {
      const result = await calculateAllSalaries(month, year);
      if (result.success) {
        alert(`Đã tính lương cho ${result.count} lái xe`);
        router.refresh();
      } else {
        alert(result.error || 'Lỗi khi tính lương');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi tính lương');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleCalculateAll}
        disabled={loading}
      >
        {loading && action === 'calculate' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Calculator className="mr-2 h-4 w-4" />
        )}
        Tính lương tất cả
      </Button>
    </div>
  );
}

interface SalaryRowActionsProps {
  driverId: string;
  driverName: string;
  month: number;
  year: number;
  status: string;
}

export function SalaryRowActions({ driverId, driverName, month, year, status }: SalaryRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm(`Xác nhận lương cho ${driverName}?`)) return;
    setLoading(true);
    try {
      const result = await confirmSalary(driverId, month, year);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Lỗi');
      }
    } catch {
      alert('Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!confirm(`Thanh toán lương cho ${driverName}?`)) return;
    setLoading(true);
    try {
      const result = await paySalary(driverId, month, year);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Lỗi');
      }
    } catch {
      alert('Lỗi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (status === 'DRAFT') {
    return (
      <Button size="sm" variant="outline" onClick={handleConfirm}>
        <CheckCircle className="mr-1 h-3 w-3" />
        Xác nhận
      </Button>
    );
  }

  if (status === 'CONFIRMED') {
    return (
      <Button size="sm" variant="default" onClick={handlePay}>
        <Banknote className="mr-1 h-3 w-3" />
        Thanh toán
      </Button>
    );
  }

  return <span className="text-xs text-green-600">Đã trả</span>;
}

interface MonthYearSelectorProps {
  currentMonth: number;
  currentYear: number;
}

export function MonthYearSelector({ currentMonth, currentYear }: MonthYearSelectorProps) {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());

  const handleChange = (newMonth: string, newYear: string) => {
    router.push(`/salaries?month=${newMonth}&year=${newYear}`);
  };

  const years = [];
  const thisYear = new Date().getFullYear();
  for (let y = thisYear; y >= thisYear - 2; y--) {
    years.push(y);
  }

  const months = [
    { value: '1', label: 'Tháng 1' },
    { value: '2', label: 'Tháng 2' },
    { value: '3', label: 'Tháng 3' },
    { value: '4', label: 'Tháng 4' },
    { value: '5', label: 'Tháng 5' },
    { value: '6', label: 'Tháng 6' },
    { value: '7', label: 'Tháng 7' },
    { value: '8', label: 'Tháng 8' },
    { value: '9', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={month}
        onValueChange={(v) => {
          setMonth(v);
          handleChange(v, year);
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={year}
        onValueChange={(v) => {
          setYear(v);
          handleChange(month, v);
        }}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
