import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MetricsChartProps {
  data: { time: string; value: number }[];
  color: string;
  title: string;
  unit: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ data, color, title, unit }) => {
  return (
    <div className="flex flex-col h-full w-full bg-slate-900/50 rounded-lg border border-slate-800 p-4 overflow-hidden relative">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
        <span className="text-lg font-mono font-bold text-slate-200">
          {data.length > 0 ? data[data.length - 1].value : 0}{unit}
        </span>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0', fontSize: '12px' }}
              itemStyle={{ color: color }}
              formatter={(value: number) => [`${value}${unit}`, title]}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#color${title.replace(/\s+/g, '')})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};