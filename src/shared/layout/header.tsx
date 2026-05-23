'use client'

import { useState, useEffect } from 'react'
import { Bell, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandPalette } from '@/features/superadmin/components/command-palette'
import { usePathname, useRouter } from 'next/navigation'

export function Header() {
  const [showNotifs, setShowNotifs] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const otherLocale = locale === 'ar' ? 'en' : 'ar'

  const switchLocale = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`)
    router.push(newPath)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        e.stopPropagation()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])

  return (
    <>
      <header className="flex h-16 items-center justify-between px-6 border-b border-white/5"
        style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors w-64"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span className="text-sm text-white/25 flex-1">Search commands...</span>
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
            <Command className="h-2.5 w-2.5 text-white/30" />
            <span className="text-xs text-white/30">/</span>
          </div>
        </button>

        <div className="flex items-center gap-2">

          {/* Language Switch */}
            <button
              onClick={switchLocale}
              className="flex h-9 min-w-[52px] items-center justify-center rounded-xl border border-white/5 bg-white/3 px-3 text-white/60 hover:text-white hover:border-white/10 transition-all text-xs font-semibold tracking-wide"
            >
              {locale === 'ar' ? 'EN' : 'العربيه'}
            </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/3 text-white/40 hover:text-white hover:border-white/10 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-72 rounded-2xl border border-white/8 p-3 shadow-2xl z-50"
                  style={{ background: '#0d0d18' }}
                >
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 mb-2">Notifications</p>
                  {[
                    { title: 'New tenant signed up', time: '2m ago', dot: 'bg-emerald-500' },
                    { title: 'Subscription renewed',  time: '1h ago', dot: 'bg-blue-500' },
                    { title: 'Trial expiring soon',   time: '3h ago', dot: 'bg-amber-500' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-2 hover:bg-white/5 cursor-pointer transition-colors">
                      <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.dot}`} />
                      <div>
                        <p className="text-xs text-white/80">{n.title}</p>
                        <p className="text-xs text-white/30">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-5 w-px bg-white/8 mx-1" />

          <button className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/3 px-3 py-1.5 hover:border-white/10 hover:bg-white/8 transition-all">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              SA
            </div>
            <span className="text-xs font-medium text-white/70">Super Admin</span>
          </button>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}