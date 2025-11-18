import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')
    const pathname = req.nextUrl.pathname

    console.log('Middleware - pathname:', pathname, 'hasToken:', !!token, 'isAuthPage:', isAuthPage)

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthPage && token) {
      console.log('Middleware: Redirecting authenticated user from auth page to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    console.log('Middleware: Allowing request to', pathname)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')
        const pathname = req.nextUrl.pathname

        console.log('Middleware authorized callback - pathname:', pathname, 'hasToken:', !!token, 'isAuthPage:', isAuthPage)

        // Allow access to auth pages without token
        if (isAuthPage) {
          console.log('Middleware: Allowing access to auth page')
          return true
        }

        // Require token for protected routes
        const authorized = !!token
        console.log('Middleware: Authorization result for', pathname, ':', authorized)
        return authorized
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
