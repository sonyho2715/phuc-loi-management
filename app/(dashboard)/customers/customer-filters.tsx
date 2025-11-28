'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useCallback, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/hooks/use-debounce';

const customerTypes = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'MIXING_STATION', label: 'Trạm trộn bê tông' },
  { value: 'RESELLER', label: 'Đại lý' },
  { value: 'PROJECT', label: 'Dự án' },
  { value: 'OTHER', label: 'Khác' },
];

export function CustomerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/customers?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParams('search', value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const clearFilters = () => {
    setSearch('');
    router.push('/customers');
  };

  const hasFilters = search || searchParams.get('type');

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, liên hệ, SĐT..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={searchParams.get('type') || 'all'}
        onValueChange={(value) => updateParams('type', value)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Loại khách hàng" />
        </SelectTrigger>
        <SelectContent>
          {customerTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
