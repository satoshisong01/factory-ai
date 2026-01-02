'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface SensorChartProps {
  type: 'TEMP' | 'GAS'; // 온도인지 가스인지 구분
  isWarning: boolean; // 공장이 위험 상태인지
}

export default function SensorChart({ type, isWarning }: SensorChartProps) {
  const [data, setData] = useState<any[]>([]);

  // 초기 데이터 생성 및 1초마다 갱신
  useEffect(() => {
    // 초기 데이터 10개 채우기
    const initialData = Array.from({ length: 10 }, (_, i) => ({
      time: i,
      value: generateValue(type, isWarning),
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prev) => {
        // 맨 앞 데이터 지우고, 맨 뒤에 새 데이터 추가 (Queue 방식)
        const newData = [
          ...prev.slice(1),
          {
            time: new Date().toLocaleTimeString('en-US', {
              hour12: false,
              minute: '2-digit',
              second: '2-digit',
            }),
            value: generateValue(type, isWarning),
          },
        ];
        return newData;
      });
    }, 1000); // 1초마다 갱신

    return () => clearInterval(interval);
  }, [type, isWarning]);

  // 랜덤 값 생성기 (위험 상태면 값이 팍 튀게 설정)
  const generateValue = (type: string, isWarning: boolean) => {
    if (type === 'TEMP') {
      // 온도: 정상 20~25도 / 위험 80~100도
      const base = isWarning ? 80 : 22;
      return +(base + Math.random() * 5).toFixed(1);
    } else {
      // 가스: 정상 0.001~0.005 / 위험 4.0~5.0
      const base = isWarning ? 4.0 : 0.002;
      return +(base + Math.random() * 0.5).toFixed(3);
    }
  };

  // 색상 설정 (위험하면 빨강, 아니면 파랑/초록)
  const chartColor = isWarning
    ? '#ef4444' // Red (Danger)
    : type === 'TEMP'
    ? '#60a5fa'
    : '#4ade80'; // Blue(Temp) or Green(Gas)

  return (
    <div className="w-full h-32 bg-slate-900/50 rounded-lg p-2 border border-slate-800">
      <div className="text-xs font-bold text-slate-400 mb-2 flex justify-between">
        <span>
          {type === 'TEMP' ? '실시간 온도 (°C)' : '유해 가스 농도 (ppm)'}
        </span>
        <span style={{ color: chartColor }}>
          {data.length > 0 && data[data.length - 1].value}
          {type === 'TEMP' ? '°C' : ' ppm'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            opacity={0.5}
            vertical={false}
          />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              color: '#fff',
              fontSize: '12px',
            }}
            itemStyle={{ color: chartColor }}
            labelStyle={{ display: 'none' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // 실시간 느낌을 위해 애니메이션 끔
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
