'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import KakaoMap from '@/components/KakaoMap';
import DashboardChart from '@/components/DashboardChart';
import {
  Activity,
  AlertTriangle,
  Factory,
  CheckCircle2,
  Siren,
  Clock,
  Bell,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    warning: 0,
    danger: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const { data: factoryData } = await supabase
      .from('factories')
      .select('status');

    if (factoryData) {
      setStats({
        total: factoryData.length,
        normal: factoryData.filter((f) => f.status === 'NORMAL').length,
        warning: factoryData.filter((f) => f.status === 'WARNING').length,
        danger: factoryData.filter((f) => f.status === 'DANGER').length,
      });
    }

    const { data: logData } = await supabase
      .from('event_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (logData) {
      setLogs(logData);
      const alerts = logData
        .filter((log) => log.status === 'WARNING' || log.status === 'DANGER')
        .slice(0, 3);
      setActiveAlerts(alerts);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      await fetchData();
      setIsLoading(false);
    };

    init();

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'factories' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_logs' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, fetchData]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <p>관제 시스템 연결 중...</p>
        </div>
      </div>
    );
  }

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'green':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'orange':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'red':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-800 text-white border-slate-700';
    }
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col gap-4 lg:gap-6 bg-slate-950 overflow-y-auto lg:overflow-hidden">
      {/* 1. 상단 통계 카드 (모바일 2열 / PC 4열) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 flex-shrink-0">
        {[
          {
            label: '전체 모니터링',
            value: stats.total,
            unit: '개소',
            icon: Factory,
            color: 'white',
          },
          {
            label: '정상 가동',
            value: stats.normal,
            unit: '개소',
            icon: CheckCircle2,
            color: 'green',
          },
          {
            label: '주의 단계',
            value: stats.warning,
            unit: '건',
            icon: AlertTriangle,
            color: 'orange',
          },
          {
            label: '긴급(위험)',
            value: stats.danger,
            unit: '건',
            icon: Siren,
            color: 'red',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-3 lg:p-4 rounded-xl border flex items-center justify-between ${getCardStyle(
              stat.color
            )} shadow-lg transition-all duration-500`}
          >
            <div>
              <p className="text-[10px] lg:text-xs font-bold opacity-70 mb-1">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-xl lg:text-2xl font-bold">{stat.value}</h3>
                <span className="text-[10px] lg:text-xs opacity-70">
                  {stat.unit}
                </span>
              </div>
            </div>
            <div className={`p-1.5 lg:p-2 rounded-lg bg-black/20`}>
              <stat.icon size={20} className="lg:w-6 lg:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. 메인 컨텐츠 그리드 (모바일: 세로 쌓기 / PC: 가로 12칸 그리드) */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        {/* [좌측] 지도 및 통계 차트 (PC: 8칸) */}
        <div className="col-span-8 flex flex-col gap-4 lg:gap-6 lg:h-full">
          {/* 지도 영역 (모바일: 높이 400px 고정 / PC: 비율 채움) */}
          <div className="h-[400px] lg:h-auto lg:flex-[0.6] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative shadow-lg flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              실시간 위치 관제
            </div>
            <div className="flex-1 w-full relative">
              <KakaoMap />
            </div>
          </div>

          {/* 차트 영역 (모바일: 높이 300px 고정 / PC: 비율 채움) */}
          <div className="h-[300px] lg:h-auto lg:flex-[0.4] min-h-0">
            <DashboardChart />
          </div>
        </div>

        {/* [우측] 알림 및 로그 패널 (PC: 4칸) */}
        <div className="col-span-4 flex flex-col gap-4 lg:gap-6 lg:h-full overflow-hidden">
          {/* 긴급 알림 현황 (모바일: 높이 250px 고정 / PC: 비율 채움) */}
          <div
            className={`h-[250px] lg:h-auto lg:flex-[0.4] bg-slate-900 rounded-xl border flex flex-col shadow-lg overflow-hidden transition-colors duration-500 ${
              activeAlerts.length > 0 ? 'border-red-500/30' : 'border-slate-800'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                activeAlerts.length > 0
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-800'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold ${
                  activeAlerts.length > 0 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                <Bell
                  className={activeAlerts.length > 0 ? 'animate-bounce' : ''}
                  size={18}
                />
                긴급 알림 현황
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  activeAlerts.length > 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/20'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}
              >
                {activeAlerts.length} Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <CheckCircle2 size={32} className="text-green-500/50" />
                  <span className="text-sm">현재 긴급한 알림이 없습니다.</span>
                </div>
              ) : (
                activeAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 items-start relative overflow-hidden group hover:bg-red-500/15 transition-colors cursor-pointer animate-in slide-in-from-right duration-300"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="mt-0.5 text-red-500 bg-red-500/20 p-1.5 rounded-full">
                      <Siren size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-red-200 text-sm truncate">
                          {alert.factory_name}
                        </span>
                        <span className="text-[10px] text-red-400/70 whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-red-300 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 전체 감지 이력 (모바일: 높이 400px 고정 / PC: 비율 채움) */}
          <div className="h-[400px] lg:h-auto lg:flex-[0.6] bg-slate-900 rounded-xl border border-slate-800 flex flex-col shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <Clock size={18} />
                최근 감지 이력
              </div>
              <button
                onClick={() => router.push('/logs')}
                className="text-xs text-blue-400 hover:underline"
              >
                전체보기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors flex items-center gap-3 text-sm animate-in fade-in duration-300"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      log.status === 'WARNING' || log.status === 'DANGER'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-green-500'
                    }`}
                  ></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-300 truncate">
                        {log.factory_name}
                      </span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 truncate block">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
