'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Check, X, ShieldAlert, User, Factory, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  factory_id?: number;
}

interface FactoryItem {
  id: number;
  name: string;
}

export default function AdminUserPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [users, setUsers] = useState<Profile[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]); // ✅ DB에서 가져올 공장 목록
  const [loading, setLoading] = useState(true);

  // 각 유저별로 선택된 공장 ID 저장
  const [selectedFactoryMap, setSelectedFactoryMap] = useState<{
    [key: string]: number;
  }>({});

  // 1. 유저 목록과 공장 목록을 한 번에 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // (1) 승인 대기 유저 가져오기
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (userData) setUsers(userData);

      // (2) ✅ 공장 목록 DB에서 가져오기 (하드코딩 제거됨)
      const { data: factoryData } = await supabase
        .from('factories')
        .select('id, name')
        .order('id');

      if (factoryData) setFactories(factoryData);

      setLoading(false);
    };

    fetchData();
  }, []); // 의존성 배열 비움 (한 번만 실행)

  // 공장 선택 핸들러
  const handleFactorySelect = (userId: string, factoryId: string) => {
    setSelectedFactoryMap((prev) => ({
      ...prev,
      [userId]: Number(factoryId),
    }));
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    // 승인('approved')일 경우 공장 선택 필수 체크
    let factoryId = selectedFactoryMap[userId] || null;

    if (newStatus === 'approved') {
      if (!factoryId) {
        alert('승인하려면 먼저 담당할 공장을 선택해주세요.');
        return;
      }
      const confirmMsg = '이 회원을 승인하시겠습니까?';
      if (!window.confirm(confirmMsg)) return;
    } else {
      const confirmMsg = '이 회원의 가입을 거절하시겠습니까?';
      if (!window.confirm(confirmMsg)) return;
      factoryId = null;
    }

    // 업데이트 쿼리
    const { error } = await supabase
      .from('profiles')
      .update({
        status: newStatus,
        factory_id: factoryId, // 선택한 공장 ID 저장
        role: 'facility_admin', // ✅ 승인 시 기본적으로 '시설 관리자' 권한 부여
      })
      .eq('id', userId);

    if (!error) {
      alert(`처리가 완료되었습니다. (${newStatus})`);
      // 선택값 초기화
      const newMap = { ...selectedFactoryMap };
      delete newMap[userId];
      setSelectedFactoryMap(newMap);

      // 목록에서 제거 (새로고침 없이)
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      alert('오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-blue-500" size={32} />
          <h1 className="text-2xl font-bold">회원 가입 승인 요청 목록</h1>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-950/50 font-bold text-slate-400 text-sm">
            <div className="col-span-3">이메일</div>
            <div className="col-span-3">가입 요청일</div>
            <div className="col-span-2">현재 상태</div>
            <div className="col-span-2">담당 공장 지정</div>
            <div className="col-span-2 text-right">관리</div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Check className="text-green-500/50 mb-2" size={48} />
              <p className="text-lg font-medium text-slate-400">
                대기 중인 요청이 없습니다.
              </p>
              <p className="text-sm">모든 회원이 처리되었습니다.</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                  <span
                    className="font-mono text-sm truncate"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </div>
                <div className="col-span-3 text-slate-400 text-xs">
                  {new Date(user.created_at).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
                    승인 대기중
                  </span>
                </div>

                {/* 🏭 공장 선택 Dropdown (DB 데이터 연동됨) */}
                <div className="col-span-2">
                  <div className="relative">
                    <Factory
                      className="absolute left-2 top-2.5 text-slate-500"
                      size={14}
                    />
                    <select
                      className="w-full bg-slate-950 border border-slate-700 rounded py-1.5 pl-8 pr-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-500 transition-colors"
                      value={selectedFactoryMap[user.id] || ''}
                      onChange={(e) =>
                        handleFactorySelect(user.id, e.target.value)
                      }
                    >
                      <option value="">공장 선택...</option>
                      {factories.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => handleStatusChange(user.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Check size={14} /> 승인
                  </button>
                  <button
                    onClick={() => handleStatusChange(user.id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 rounded text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <X size={14} /> 거절
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
