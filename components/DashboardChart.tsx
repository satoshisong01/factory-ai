'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: '월', warning: 4, danger: 0 },
  { name: '화', warning: 3, danger: 1 },
  { name: '수', warning: 2, danger: 0 },
  { name: '목', warning: 6, danger: 2 }, // 사고 많이 난 날
  { name: '금', warning: 1, danger: 0 },
  { name: '토', warning: 2, danger: 0 },
  { name: '일', warning: 1, danger: 0 },
];

export default function DashboardChart() {
  return (
    <div className="w-full h-full bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-lg">
      <h3 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
        📊 주간 경보 발생 추이
      </h3>

      <div className="h-64 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                color: '#fff',
                borderRadius: '8px',
              }}
              cursor={{ fill: '#334155', opacity: 0.4 }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
              dataKey="warning"
              name="주의 (Warning)"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar
              dataKey="danger"
              name="위험 (Danger)"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
