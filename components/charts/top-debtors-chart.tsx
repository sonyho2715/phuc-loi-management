'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface TopDebtorsChartProps {
  data: { id: string; name: string; debt: number }[];
}

const colors = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
];

export function TopDebtorsChart({ data }: TopDebtorsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Chưa có dữ liệu công nợ
      </div>
    );
  }

  // Truncate long names
  const chartData = data.map((item) => ({
    ...item,
    shortName: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => {
              if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(0)}B`;
              }
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(0)}M`;
              }
              return value;
            }}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Công nợ']}
            labelFormatter={(label) => {
              const item = chartData.find((d) => d.shortName === label);
              return item?.name || label;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          />
          <Bar dataKey="debt" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
