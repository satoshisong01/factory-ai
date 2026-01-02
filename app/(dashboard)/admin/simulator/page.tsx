'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Siren,
  Zap,
  Gamepad, // ✅ Gamepad2 -> Gamepad 로 수정됨
} from 'lucide-react';

export default function SimulatorPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [factories, setFactories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 공장 목록 불러오기
  const fetchFactories = async () => {
    const { data } = await supabase.from('factories').select('*').order('id');
    if (data) setFactories(data);
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  // 🔥 상태 변경 함수 (핵심 기능)
  const updateStatus = async (
    factoryId: number,
    factoryName: string,
    newStatus: string
  ) => {
    setLoading(true);

    // 1. 공장 상태 업데이트
    await supabase
      .from('factories')
      .update({ status: newStatus })
      .eq('id', factoryId);

    // 2. 로그 기록 남기기 (이력이 남아야 대시보드 알림창에도 뜸)
    let message = '';
    if (newStatus === 'NORMAL') message = '시설 점검 완료. 정상 가동 전환.';
    if (newStatus === 'WARNING') message = '⚠️ 이상 징후 감지 (압력 상승)';
    if (newStatus === 'DANGER')
      message = '🚨 긴급: 유해 화학물질 누출 사고 발생!';

    await supabase.from('event_logs').insert({
      factory_name: factoryName,
      status: newStatus,
      message: message,
    });

    // 3. 목록 새로고침
    await fetchFactories();
    setLoading(false);

    alert(`[${factoryName}] 상태가 ${newStatus}로 변경되었습니다.`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
          {/* ✅ 여기도 Gamepad2 -> Gamepad 로 수정됨 */}
          <Gamepad size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            재난 시뮬레이션 제어판
          </h1>
          <p className="text-slate-400">
            인위적으로 사고 상황을 발생시켜 관제 시스템을 테스트합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {factories.map((factory) => (
          <div
            key={factory.id}
            className={`p-6 rounded-xl border transition-all ${
              factory.status === 'DANGER'
                ? 'bg-red-900/20 border-red-500'
                : factory.status === 'WARNING'
                ? 'bg-orange-900/20 border-orange-500'
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {factory.name}
                </h3>
                <p className="text-sm text-slate-400">{factory.address}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  factory.status === 'DANGER'
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : factory.status === 'WARNING'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                }`}
              >
                {factory.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updateStatus(factory.id, factory.name, 'NORMAL')}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500 border border-transparent transition-all group"
              >
                <CheckCircle2 className="text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400">
                  정상 (Normal)
                </span>
              </button>

              <button
                onClick={() =>
                  updateStatus(factory.id, factory.name, 'WARNING')
                }
                disabled={loading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800 hover:bg-orange-600/20 hover:border-orange-500 border border-transparent transition-all group"
              >
                <AlertTriangle className="text-orange-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-300 group-hover:text-orange-400">
                  주의 (Warning)
                </span>
              </button>

              <button
                onClick={() => updateStatus(factory.id, factory.name, 'DANGER')}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800 hover:bg-red-600/20 hover:border-red-500 border border-transparent transition-all group"
              >
                <Siren className="text-red-500 group-hover:scale-110 transition-transform animate-pulse" />
                <span className="text-xs font-bold text-slate-300 group-hover:text-red-400">
                  위험 (Danger)
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
