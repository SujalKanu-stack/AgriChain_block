import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardAreaChartCard({
  title,
  description,
  data,
  dataKey = "value",
  color = "#10b981",
  valueFormatter = (value) => String(value),
}) {
  return (
    <div className="glass-card role-chart-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.18)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
            <Tooltip
              formatter={(value) => [valueFormatter(value), title]}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.18)",
                boxShadow: "0 18px 40px -24px rgba(15,23,42,0.35)",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`url(#gradient-${dataKey})`}
              strokeWidth={3}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
