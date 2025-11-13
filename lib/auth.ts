import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import prisma from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  debug: true, // Enable debug mode to see what's happening
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('[AUTH] Redirect callback:', { url, baseUrl })
      // Handles redirect after successful sign in
      // If url is relative, prepend baseUrl
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('[AUTH] Redirecting to:', redirectUrl)
        return redirectUrl
      }
      // If url is from same origin, allow it
      if (new URL(url).origin === baseUrl) {
        console.log('[AUTH] Redirecting to:', url)
        return url
      }
      // Default to dashboard
      const defaultUrl = `${baseUrl}/dashboard`
      console.log('[AUTH] Redirecting to default:', defaultUrl)
      return defaultUrl
    },
    async session({ token, session }) {
      console.log('[AUTH] Session callback:', { hasToken: !!token, hasUser: !!session.user })
      if (token && session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      console.log('[AUTH] JWT callback:', { hasUser: !!user, tokenId: token.id })
      if (user) {
        token.id = user.id
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
        console.log('[AUTH] Attempting to authorize:', { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        console.log('[AUTH] User found:', !!user)

        if (!user || !user.password) {
          console.log('[AUTH] User not found or no password')
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        console.log('[AUTH] Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password')
          return null
        }

        console.log('[AUTH] Authorization successful for:', user.email)
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
