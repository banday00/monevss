'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/components/layout/ThemeProvider';

interface DataPoint {
  month: string;
  count: number;
}

interface TrendChartProps {
  data: DataPoint[];
}

function useCSSVar(varName: string, fallback: string): string {
  const { theme } = useTheme();
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    setValue(v || fallback);
  }, [theme, varName, fallback]);
  return value;
}

export default function TrendChart({ data }: TrendChartProps) {
  const tooltipBg = useCSSVar('--chart-tooltip-bg', 'rgba(17,24,39,0.95)');
  const tooltipBorder = useCSSVar('--chart-tooltip-border', 'rgba(148,163,184,0.15)');
  const tooltipText = useCSSVar('--chart-tooltip-text', '#f1f5f9');
  const tick = useCSSVar('--chart-tick', '#64748b');
  const grid = useCSSVar('--chart-grid', 'rgba(148,163,184,0.08)');
  const activeDotStroke = useCSSVar('--chart-activedot-stroke', '#0a0f1e');

  const formattedData = data.map((d) => {
    const [year, month] = d.month.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    return {
      ...d,
      label: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
    };
  });

  return (
    <div className="chart-container" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis
            dataKey="label"
            tick={{ fill: tick, fontSize: 11 }}
            axisLine={{ stroke: grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tick, fontSize: 11 }}
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
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: tick, fontWeight: 600, marginBottom: 4 }}
            formatter={(value: unknown) => [`${value} dataset`, 'Jumlah']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCount)"
            dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 6, fill: '#10b981', stroke: activeDotStroke, strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

