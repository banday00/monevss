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

export default function TopOrgChart({ data }: TopOrgChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
  }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={150}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: '10px',
              color: '#f1f5f9',
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
