import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')

        // Allow access to auth pages without token
        if (isAuthPage) {
          return true
        }

        // Require token for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/portfolio/:path*',
    '/api/dividends/:path*',
    '/api/screener/:path*',
    '/auth/:path*',
  ],
}
