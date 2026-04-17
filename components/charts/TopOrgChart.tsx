'use client';

import { useState, useEffect } from 'react';
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
import { useTheme } from '@/components/layout/ThemeProvider';

interface OrgData {
  id: number;
  name: string;
  count_dataset_all: number;
  count_dataset_public: number;
}

interface TopOrgChartProps {
  data: OrgData[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

function useCSSVar(varName: string, fallback: string): string {
  const { theme } = useTheme();
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    setValue(v || fallback);
  }, [theme, varName, fallback]);
  return value;
}

export default function TopOrgChart({ data }: TopOrgChartProps) {
  const tooltipBg = useCSSVar('--chart-tooltip-bg', 'rgba(17,24,39,0.95)');
  const tooltipBorder = useCSSVar('--chart-tooltip-border', 'rgba(148,163,184,0.15)');
  const tooltipText = useCSSVar('--chart-tooltip-text', '#f1f5f9');
  const tick = useCSSVar('--chart-tick', '#64748b');
  const tickLight = useCSSVar('--text-secondary', '#94a3b8');
  const grid = useCSSVar('--chart-grid', 'rgba(148,163,184,0.08)');

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name,
  }));

  return (
    <div className="chart-container" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={200}
            tick={{ fill: tickLight, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '10px',
              color: tooltipText,
              fontSize: '13px',
            }}
            formatter={(value: unknown) => [`${value} dataset`, 'Total']}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="count_dataset_all" radius={[0, 6, 6, 0]} barSize={24}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

