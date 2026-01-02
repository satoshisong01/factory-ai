'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. 기본 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. [핵심] 로그인 성공 후, profiles 테이블에서 승인 상태 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', data.user.id)
        .single();

      // 3. 승인 대기중(pending)이거나 거절(rejected)된 경우
      if (profile && profile.status !== 'approved') {
        // 강제 로그아웃 시키기
        await supabase.auth.signOut();

        if (profile.status === 'pending') {
          alert(
            '🚫 관리자 승인 대기 중입니다.\n승인이 완료되면 로그인할 수 있습니다.'
          );
        } else if (profile.status === 'rejected') {
          alert('❌ 가입 승인이 거절되었습니다.\n관리자에게 문의하세요.');
        }
        setLoading(false);
        return;
      }

      // 4. 승인된(approved) 유저라면 메인으로 이동
      console.log('로그인 성공:', profile);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-600/20 text-green-500 mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Factory AI 로그인</h1>
          <p className="text-slate-400 text-sm mt-2">관계자 외 접근 금지</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">
              이메일
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-slate-500"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-500"
                size={18}
              />
              <input
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertTriangle size={16} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="text-green-400 hover:text-green-300 font-bold"
          >
            가입 신청하기
          </Link>
        </div>
      </div>
    </div>
  );
}
