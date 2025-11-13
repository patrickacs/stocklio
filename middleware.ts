import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(_req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth/')) {
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
