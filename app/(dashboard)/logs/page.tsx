'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Log {
  id: number;
  factory_name: string;
  status: string;
  message: string;
  created_at: string;
}

export default function LogsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-blue-500" size={32} />
        <h1 className="text-2xl font-bold">위험 감지 이력 (System Logs)</h1>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-950 font-bold text-slate-400 text-sm">
          <div className="col-span-2">발생 시간</div>
          <div className="col-span-3">공장명</div>
          <div className="col-span-2">상태</div>
          <div className="col-span-5">감지 내용</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            로그를 불러오는 중...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            기록된 이력이 없습니다.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors text-sm"
            >
              <div className="col-span-2 text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </div>
              <div className="col-span-3 font-bold text-slate-300">
                {log.factory_name}
              </div>
              <div className="col-span-2">
                {log.status === 'WARNING' ? (
                  <span className="flex items-center gap-1 text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded w-fit">
                    <AlertTriangle size={12} /> 위험 (Warning)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded w-fit">
                    <CheckCircle2 size={12} /> 정상 (Normal)
                  </span>
                )}
              </div>
              <div className="col-span-5 text-slate-400 truncate">
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
