import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/db'

// Debug: Log environment variables (redacted)
console.log('=== AUTH CONFIG INITIALIZATION ===')
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
console.log('NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length)
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('useSecureCookies will be:', process.env.NODE_ENV === 'production')

export const authOptions: NextAuthOptions = {
  // NOTE: Removed PrismaAdapter - not needed with JWT strategy
  // Using JWT strategy means sessions are stored in JWTs, not the database
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl)

      // If url is relative, prepend baseUrl
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('Redirecting to relative URL:', redirectUrl)
        return redirectUrl
      }

      // If url has the same origin as baseUrl, allow it
      if (new URL(url).origin === baseUrl) {
        console.log('Redirecting to same origin URL:', url)
        return url
      }

      // Default redirect to dashboard
      const defaultUrl = `${baseUrl}/dashboard`
      console.log('Redirecting to default:', defaultUrl)
      return defaultUrl
    },
    async session({ token, session }) {
      console.log('Session callback - token:', !!token, 'session:', !!session)

      if (token && session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      console.log('JWT callback - user:', !!user, 'token:', !!token)

      if (user) {
        token.id = user.id
        console.log('JWT: Added user id to token:', user.id)
      }

      return token
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'john@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        console.log('=== AUTHORIZE CALLBACK ===')
        console.log('Credentials received:', !!credentials)

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        console.log('Looking up user:', credentials.email)
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          console.log('User not found or no password')
          return null
        }

        console.log('User found, verifying password')
        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          console.log('Invalid password')
          return null
        }

        console.log('Password valid, returning user:', user.id)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
}
