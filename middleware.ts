import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

<<<<<<< HEAD
  const publicPaths = ['/login', '/register', '/auth', '/api']
  const isPublic = publicPaths.some(p => pathname.startsWith(p)) || pathname === '/'

  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token') ||
=======
  // Статические пути — пропускаем
  const publicPaths = ['/login', '/register', '/auth', '/api']
  const isPublic = publicPaths.some(p => pathname.startsWith(p)) || pathname === '/'

  // Проверяем наличие сессии через cookie
  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token') ||
    // Supabase SSR использует такой формат куки
>>>>>>> ba513e1ab4353ec7ccb272974ca3c8a76e300acf
    [...request.cookies.getAll()].some(c => c.name.includes('auth-token'))

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
