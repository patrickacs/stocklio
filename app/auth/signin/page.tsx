'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('=== SIGN IN ATTEMPT ===')
      console.log('Email:', email)

      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/dashboard',
        redirect: false,
      })

      console.log('=== SIGN IN RESULT ===')
      console.log('Result:', JSON.stringify(result, null, 2))

      if (result?.error) {
        console.error('=== SIGN IN ERROR ===', result.error)
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
        setIsLoading(false)
      } else if (result?.ok) {
        console.log('=== SIGN IN SUCCESSFUL ===')
        console.log('Result URL:', result.url)

        toast({
          title: 'Welcome back!',
          description: 'Redirecting to dashboard...',
        })

        // Wait longer for the session cookie to be set and propagate
        console.log('=== WAITING FOR SESSION COOKIE ===')
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('=== CHECKING COOKIES ===')
        console.log('All cookies:', document.cookie)

        // Use the URL provided by NextAuth or fallback to dashboard
        const redirectUrl = result.url || '/dashboard'
        console.log('=== REDIRECTING TO ===', redirectUrl)

        // Use router.push for client-side navigation first
        // This works better with Next.js App Router
        router.push('/dashboard')

        // Fallback: if router.push doesn't work, use window.location
        setTimeout(() => {
          console.log('=== FALLBACK REDIRECT ===')
          window.location.href = '/dashboard'
        }, 500)
      } else {
        console.warn('=== UNEXPECTED RESULT ===', result)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('=== EXCEPTION DURING SIGN IN ===', error)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo showText={true} />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600">
              Sign in to your STOCKLIO account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-navy-600 hover:bg-navy-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-navy-600 hover:text-navy-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
