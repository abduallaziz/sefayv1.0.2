'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Building2, CreditCard, Shield,
  BarChart3, Command, ChevronRight,
} from 'lucide-react'

type DangerLevel = 'safe'
type Category = 'Navigation'

interface CommandItem {
  id: string
  title: string
  category: Category
  keywords: string[]
  icon: React.ReactNode
  dangerLevel: DangerLevel
  shortcut?: string[]
  handler: () => void
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Navigation: <BarChart3 className="h-3.5 w-3.5" />,
}

const categoryColors: Record<Category, string> = {
  Navigation: '#818cf8',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const locale = useLocale()

  const ALL_COMMANDS: CommandItem[] = [
    { id: 'nav-overview', title: 'Go to Overview',      category: 'Navigation', keywords: ['home', 'dashboard', 'console'],      icon: <BarChart3 className="h-4 w-4" />,  dangerLevel: 'safe', shortcut: ['G', 'O'], handler: () => router.push(`/${locale}/superadmin`) },
    { id: 'nav-tenants',  title: 'Go to Tenants',       category: 'Navigation', keywords: ['tenants', 'businesses', 'customers'], icon: <Building2 className="h-4 w-4" />,  dangerLevel: 'safe', shortcut: ['G', 'T'], handler: () => router.push(`/${locale}/superadmin/tenants`) },
    { id: 'nav-billing',  title: 'Go to Subscriptions', category: 'Navigation', keywords: ['billing', 'subscriptions', 'plans'],  icon: <CreditCard className="h-4 w-4" />, dangerLevel: 'safe', shortcut: ['G', 'B'], handler: () => router.push(`/${locale}/superadmin/subscriptions`) },
    { id: 'nav-audit',    title: 'Go to Audit Logs',    category: 'Navigation', keywords: ['audit', 'logs', 'history'],           icon: <Shield className="h-4 w-4" />,     dangerLevel: 'safe', shortcut: ['G', 'A'], handler: () => router.push(`/${locale}/superadmin/reports`) },
  ]

  const filtered = query
    ? ALL_COMMANDS.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : ALL_COMMANDS

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  const flat = Object.values(grouped).flat()

  const handleSelect = useCallback((cmd: CommandItem) => {
    cmd.handler()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelected(0)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); if (flat[selected]) handleSelect(flat[selected]) }
      if (e.key === 'Escape') { onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selected, flat, handleSelect, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-[rgba(255,255,255,0.08)]"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/5">
              <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/30" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none"
              />
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/8 bg-slate-100 dark:bg-white/5 px-2 py-1">
                <Command className="h-3 w-3 text-slate-400 dark:text-white/25" />
                <span className="text-xs text-slate-400 dark:text-white/25">/</span>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
              {Object.entries(grouped).map(([category, commands]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-white dark:bg-[#0a0a0f]">
                    <span style={{ color: categoryColors[category as Category] }}>
                      {categoryIcons[category as Category]}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: categoryColors[category as Category] }}>
                      {category}
                    </span>
                  </div>

                  {commands.map((cmd) => {
                    const globalIndex = flat.indexOf(cmd)
                    const isSelected = globalIndex === selected

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelected(globalIndex)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                        style={{
                          background: isSelected ? 'rgba(124,58,237,0.08)' : 'transparent',
                          borderLeft: isSelected ? '2px solid rgba(124,58,237,0.6)' : '2px solid transparent',
                        }}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60">
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-600 dark:text-white/60">{cmd.title}</span>
                        </div>
                        {cmd.shortcut && (
                          <div className="flex items-center gap-1">
                            {cmd.shortcut.map((k, i) => (
                              <span key={i} className="rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 dark:text-white/30">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                        {isSelected && <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-white/30 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-white/25">
                  No commands found for "{query}"
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-200 dark:border-white/5 px-4 py-2.5">
              {[
                { keys: ['↑', '↓'], label: 'Navigate' },
                { keys: ['↵'],      label: 'Execute' },
                { keys: ['Esc'],    label: 'Close' },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {keys.map(k => (
                    <span key={k} className="rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 dark:text-white/30">{k}</span>
                  ))}
                  <span className="text-[10px] text-slate-400 dark:text-white/20">{label}</span>
                </div>
              ))}
              <span className="ml-auto text-[10px] text-slate-300 dark:text-white/15">{filtered.length} commands</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}