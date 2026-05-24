'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  ToggleLeft, BarChart3, Settings, ChevronRight, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavLabel = { en: string; ar: string }

const navItems: { href: string; icon: React.ElementType; label: NavLabel }[] = [
  { href: '/superadmin', icon: LayoutDashboard, label: { en: 'Overview', ar: 'الرئيسية' } },
  { href: '/superadmin/tenants', icon: Building2, label: { en: 'Tenants', ar: 'المستأجرون' } },
  { href: '/superadmin/subscriptions', icon: CreditCard, label: { en: 'Subscriptions', ar: 'الاشتراكات' } },
  { href: '/superadmin/feature-flags', icon: ToggleLeft, label: { en: 'Feature Flags', ar: 'المميزات' } },
  { href: '/superadmin/auth-control', icon: Users, label: { en: 'Auth Control', ar: 'المستخدمون' } },
  { href: '/superadmin/reports', icon: BarChart3, label: { en: 'Reports & Audit', ar: 'التقارير' } },
  { href: '/superadmin/settings', icon: Settings, label: { en: 'Settings', ar: 'الإعدادات' } },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const localizedHref = (href: string) => `/${locale}${href}`

  const isActive = (href: string) => {
    const full = localizedHref(href)
    return pathname === full || pathname.startsWith(full + '/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col"
      style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d18 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Zap className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl blur-md opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-sm font-bold text-white tracking-wide">Sefay</p>
                <p className="text-xs text-white/30">Super Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={localizedHref(item.href)}
              className={cn(
                'relative flex h-10 items-center rounded-xl px-3 text-sm font-medium transition-all duration-200 group',
                active ? 'text-white' : 'text-white/35 hover:text-white/70'
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.15))' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              {active && (
                <div className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-violet-500" />
              )}
              <item.icon className={cn('h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110', collapsed ? 'mx-auto' : 'me-3')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label[locale]}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0d0d18] text-white/40 hover:text-white transition-colors z-10"
      >
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
          <ChevronRight className="h-3 w-3" />
        </motion.div>
      </button>

      {/* Bottom user */}
      <div className="border-t border-white/5 p-3">
        <div className={cn('flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors cursor-pointer', collapsed && 'justify-center')}>
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            SA
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs font-semibold text-white">Super Admin</p>
                <p className="text-xs text-white/30">admin@sefay.com</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}