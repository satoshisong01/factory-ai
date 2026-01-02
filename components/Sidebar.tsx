'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, FileText, Settings, ShieldAlert, LogOut } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // 로그인 페이지 등에서는 사이드바 숨기기
  if (pathname === '/login' || pathname === '/signup') return null;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data?.role === 'super_admin') setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const menuItems = [
    { name: '실시간 관제', path: '/', icon: Map },
    { name: '감지 이력', path: '/logs', icon: FileText },
    // 관리자 메뉴는 조건부 렌더링
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <ShieldAlert className="text-blue-500" size={28} />
        <span className="text-xl font-bold text-white">Factory AI</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.path
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}

        {/* 관리자 전용 메뉴 */}
        {isAdmin && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/admin/users'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings size={20} />
            회원 승인 관리
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
