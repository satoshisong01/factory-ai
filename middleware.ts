import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Response 초기화
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Supabase 클라이언트 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. 사용자 정보 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // [시나리오 1] 로그인을 안 한 상태 (Guest)
  if (!user) {
    // 로그인 페이지나 회원가입 페이지가 아니라면 -> 로그인 페이지로 강제 이동
    // (이미지나 API 경로는 matcher 설정에서 제외됨)
    if (!path.startsWith('/login') && !path.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // [시나리오 2] 로그인을 한 상태 (User)
  if (user) {
    // 이미 로그인했는데 또 로그인/회원가입 페이지에 있다면 -> 메인으로 보내기
    if (path.startsWith('/login') || path.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // [권한 체크] 일반 유저가 관리자 페이지(/admin) 접근 시도 시 차단
    // 주의: user_metadata에 role이 동기화되어 있어야 작동합니다.
    // 만약 동기화 설정을 안 했다면 이 블록은 주석 처리하거나, 페이지 내부에서 체크하세요.
    /*
    const role = user.user_metadata.role;
    if (path.startsWith('/admin') && role !== 'super_admin') {
       return NextResponse.redirect(new URL('/', request.url));
    }
    */
  }

  return response;
}

export const config = {
  // 정적 파일, 이미지 등을 제외한 모든 경로에서 실행
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
