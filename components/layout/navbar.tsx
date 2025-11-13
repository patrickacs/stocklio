'use client'

import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  TrendingUp, 
  Calendar, 
  Search, 
  Settings,
  Bell,
  User,
  LogOut
} from 'lucide-react'

interface NavbarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function Navbar({ activeTab = 'portfolio', onTabChange }: NavbarProps) {
  const { data: session } = useSession()
  return (
    <motion.nav
      className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Navigation Items - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            <NavItem 
              icon={TrendingUp} 
              label="Portfolio" 
              active={activeTab === 'portfolio'}
              onClick={() => onTabChange?.('portfolio')}
            />
            <NavItem 
              icon={Calendar} 
              label="Dividends" 
              active={activeTab === 'dividends'}
              onClick={() => onTabChange?.('dividends')}
            />
            <NavItem 
              icon={Search} 
              label="Screener" 
              active={activeTab === 'screener'}
              onClick={() => onTabChange?.('screener')}
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Market Status Badge */}
            <Badge 
              variant="outline" 
              className="hidden sm:flex items-center gap-1.5 bg-green-50 border-green-200 text-green-700"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Market Open
            </Badge>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <motion.button
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${active 
          ? 'bg-navy-100 text-navy-700 shadow-sm' 
          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  )
}
