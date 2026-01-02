'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  User,
  Lock,
  Save,
  Shield,
  Factory,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 알림 메시지
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // 내 정보 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUser({ ...user, ...profile });
      setNickname(profile?.nickname || '');
      setPhone(profile?.phone || '');
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  // 정보 저장 핸들러
  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 1. 프로필 정보 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({ nickname, phone })
        .eq('id', user.id);

      if (error) throw error;

      // 2. 비밀번호 변경 (입력했을 경우에만)
      if (password) {
        if (password !== passwordConfirm) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        if (password.length < 6) {
          throw new Error('비밀번호는 6자 이상이어야 합니다.');
        }
        const { error: pwdError } = await supabase.auth.updateUser({
          password,
        });
        if (pwdError) throw pwdError;
      }

      setMessage({
        text: '회원 정보가 성공적으로 수정되었습니다.',
        type: 'success',
      });
      setPassword('');
      setPasswordConfirm('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">정보를 불러오는 중...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">계정 설정</h1>
          <p className="text-slate-400">
            내 프로필 정보와 보안 설정을 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 좌측: 프로필 요약 카드 */}
        <div className="col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
              {nickname
                ? nickname.substring(0, 2)
                : user.email?.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {nickname || '사용자'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{user.email}</p>

            <div className="w-full border-t border-slate-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Shield size={14} /> 권한
                </span>
                <span className="font-bold text-blue-400 uppercase">
                  {user.role || 'GUEST'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Factory size={14} /> 담당
                </span>
                <span className="text-slate-300">
                  {user.factory_id ? `공장 #${user.factory_id}` : '전체 관할'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 정보 수정 폼 */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* 1. 기본 정보 섹션 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-slate-400" /> 기본 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  이메일 계정
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed">
                  <Mail size={16} />
                  {user.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    전화번호
                  </label>
                  <div className="relative">
                    <Smartphone
                      size={16}
                      className="absolute left-4 top-3.5 text-slate-500"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 보안 설정 섹션 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" /> 비밀번호 변경
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="변경할 경우에만 입력하세요"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="한 번 더 입력하세요"
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                    password && password !== passwordConfirm
                      ? 'border-red-500'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {password && password !== passwordConfirm && (
                  <p className="text-red-500 text-xs mt-1 ml-1">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 알림 메시지 & 저장 버튼 */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {message && (
                <div
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {message.text}
                </div>
              )}
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Save size={18} />
              {saving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
