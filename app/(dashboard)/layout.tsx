'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Map,
  FileText,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ShieldAlert,
  Gamepad, // 🎮 시뮬레이터 아이콘
  UserCog, // ⚙️ 계정 설정 아이콘
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 관리자 여부 확인
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
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // ✅ 메뉴 설정 (기본 메뉴)
  const menuItems: any[] = [
    { name: '실시간 관제', icon: Map, path: '/' },
    { name: '감지 이력', icon: FileText, path: '/logs' },
    { name: '계정 설정', icon: UserCog, path: '/settings' }, // 👈 추가된 설정 메뉴
  ];

  // ✅ 관리자일 경우 시뮬레이터 메뉴 추가
  if (isAdmin) {
    menuItems.push({
      name: '재난 시뮬레이터',
      icon: Gamepad,
      path: '/admin/simulator',
    });
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* 1. 사이드바 (Sidebar) */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col relative z-20`}
      >
        {/* 로고 영역 */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl text-blue-500">
              <ShieldAlert /> AITMUS
            </div>
          ) : (
            <ShieldAlert className="text-blue-500" />
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${!isSidebarOpen && 'justify-center'}`}
              >
                <item.icon size={20} />
                {isSidebarOpen && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}

          {/* 시스템 관리 메뉴 (관리자 전용 - 별도 구분) */}
          {isAdmin && (
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname.startsWith('/admin/users')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Settings size={20} />
              {isSidebarOpen && (
                <span className="font-medium text-sm">시스템 관리</span>
              )}
            </Link>
          )}
        </nav>

        {/* 하단 로그아웃 */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors ${
              !isSidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={20} />
            {isSidebarOpen && (
              <span className="text-sm font-medium">로그아웃</span>
            )}
          </button>
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 (Header) */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 프로필 영역 (설정 페이지로 이동) */}
            <Link
              href="/settings"
              className="flex items-center gap-3 pl-4 border-l border-slate-800 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                AD
              </div>
              <span className="text-sm text-slate-300 font-medium hidden sm:block">
                {isAdmin ? '총괄 관리자' : '현장 담당자'}
              </span>
            </Link>
          </div>
        </header>

        {/* 실제 페이지 내용 (children) */}
        <main className="flex-1 overflow-auto bg-slate-950 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
