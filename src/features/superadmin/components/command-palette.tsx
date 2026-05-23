'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Building2, CreditCard, Shield, Zap, Server,
  BarChart3, AlertTriangle, LogOut, RefreshCw, Trash2,
  Eye, Ban, ChevronRight, Command, ArrowRight, CornerDownLeft,
} from 'lucide-react'

type DangerLevel = 'safe' | 'warning' | 'danger'
type Category = 'Navigation' | 'Tenants' | 'Billing' | 'Infrastructure' | 'AI' | 'Security'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: Category
  keywords: string[]
  icon: React.ReactNode
  dangerLevel: DangerLevel
  shortcut?: string[]
  handler: () => void
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Navigation:     <BarChart3 className="h-3.5 w-3.5" />,
  Tenants:        <Building2 className="h-3.5 w-3.5" />,
  Billing:        <CreditCard className="h-3.5 w-3.5" />,
  Infrastructure: <Server className="h-3.5 w-3.5" />,
  AI:             <Zap className="h-3.5 w-3.5" />,
  Security:       <Shield className="h-3.5 w-3.5" />,
}

const categoryColors: Record<Category, string> = {
  Navigation:     '#818cf8',
  Tenants:        '#34d399',
  Billing:        '#fbbf24',
  Infrastructure: '#60a5fa',
  AI:             '#a78bfa',
  Security:       '#f87171',
}

const dangerConfig = {
  safe:    { color: 'rgba(255,255,255,0.6)', bg: 'transparent' },
  warning: { color: '#fbbf24',              bg: 'rgba(251,191,36,0.08)' },
  danger:  { color: '#f87171',              bg: 'rgba(248,113,113,0.08)' },
}

const ALL_COMMANDS: CommandItem[] = [
  { id: 'nav-overview',      title: 'Go to Overview',           category: 'Navigation',     keywords: ['home', 'dashboard', 'console'],           icon: <BarChart3 className="h-4 w-4" />,    dangerLevel: 'safe',    shortcut: ['G', 'O'], handler: () => {} },
  { id: 'nav-tenants',       title: 'Go to Tenants',            category: 'Navigation',     keywords: ['tenants', 'businesses', 'customers'],     icon: <Building2 className="h-4 w-4" />,    dangerLevel: 'safe',    shortcut: ['G', 'T'], handler: () => {} },
  { id: 'nav-billing',       title: 'Go to Subscriptions',      category: 'Navigation',     keywords: ['billing', 'subscriptions', 'plans'],      icon: <CreditCard className="h-4 w-4" />,   dangerLevel: 'safe',    shortcut: ['G', 'B'], handler: () => {} },
  { id: 'nav-audit',         title: 'Go to Audit Logs',         category: 'Navigation',     keywords: ['audit', 'logs', 'history'],               icon: <Shield className="h-4 w-4" />,       dangerLevel: 'safe',    shortcut: ['G', 'A'], handler: () => {} },
  { id: 'tenant-suspend',    title: 'Suspend Tenant',           subtitle: 'Requires reason', category: 'Tenants', keywords: ['suspend', 'ban', 'disable', 'block'], icon: <Ban className="h-4 w-4" />,         dangerLevel: 'danger',  handler: () => {} },
  { id: 'tenant-view',       title: 'Open Tenant',              subtitle: 'Search by name',  category: 'Tenants', keywords: ['open', 'view', 'tenant'],            icon: <Eye className="h-4 w-4" />,         dangerLevel: 'safe',    handler: () => {} },
  { id: 'tenant-extend',     title: 'Extend Trial',             subtitle: 'Add 14 days',     category: 'Tenants', keywords: ['trial', 'extend', 'days'],           icon: <Building2 className="h-4 w-4" />,    dangerLevel: 'warning', handler: () => {} },
  { id: 'tenant-delete',     title: 'Delete Tenant',            subtitle: 'Irreversible',    category: 'Tenants', keywords: ['delete', 'remove', 'tenant'],        icon: <Trash2 className="h-4 w-4" />,      dangerLevel: 'danger',  handler: () => {} },
  { id: 'billing-failed',    title: 'View Failed Payments',     category: 'Billing',        keywords: ['failed', 'payments', 'billing'],          icon: <CreditCard className="h-4 w-4" />,   dangerLevel: 'safe',    handler: () => {} },
  { id: 'billing-refund',    title: 'Issue Refund',             subtitle: 'Manual refund',   category: 'Billing', keywords: ['refund', 'money', 'return'],         icon: <ArrowRight className="h-4 w-4" />,  dangerLevel: 'warning', handler: () => {} },
  { id: 'billing-retry',     title: 'Retry Failed Invoice',     category: 'Billing',        keywords: ['retry', 'invoice', 'billing'],            icon: <RefreshCw className="h-4 w-4" />,    dangerLevel: 'warning', handler: () => {} },
  { id: 'infra-queue',       title: 'Restart Queue Workers',    subtitle: 'Will cause delay', category: 'Infrastructure', keywords: ['queue', 'restart', 'workers'], icon: <RefreshCw className="h-4 w-4" />,   dangerLevel: 'warning', handler: () => {} },
  { id: 'infra-cache',       title: 'Flush Cache',              subtitle: 'Redis flush',      category: 'Infrastructure', keywords: ['cache', 'flush', 'redis'],     icon: <Server className="h-4 w-4" />,      dangerLevel: 'warning', handler: () => {} },
  { id: 'infra-maintenance', title: 'Enable Maintenance Mode',  subtitle: 'Platform-wide',    category: 'Infrastructure', keywords: ['maintenance', 'mode', 'down'], icon: <AlertTriangle className="h-4 w-4" />, dangerLevel: 'danger', handler: () => {} },
  { id: 'ai-insight',        title: 'Generate Business Insight', category: 'AI',             keywords: ['ai', 'insight', 'analyze'],               icon: <Zap className="h-4 w-4" />,         dangerLevel: 'safe',    handler: () => {} },
  { id: 'ai-anomaly',        title: 'Run Anomaly Detection',    category: 'AI',             keywords: ['anomaly', 'detection', 'ai'],             icon: <Zap className="h-4 w-4" />,         dangerLevel: 'safe',    handler: () => {} },
  { id: 'ai-churn',          title: 'Analyze Churn Risk',       category: 'AI',             keywords: ['churn', 'risk', 'ai'],                    icon: <Zap className="h-4 w-4" />,         dangerLevel: 'safe',    handler: () => {} },
  { id: 'sec-lock',          title: 'Lock Tenant Account',      subtitle: 'Immediate effect', category: 'Security', keywords: ['lock', 'freeze', 'account'],      icon: <Shield className="h-4 w-4" />,      dangerLevel: 'danger',  handler: () => {} },
  { id: 'sec-logout',        title: 'Force Logout All Users',   subtitle: 'Revoke sessions',  category: 'Security', keywords: ['logout', 'sessions', 'revoke'],   icon: <LogOut className="h-4 w-4" />,      dangerLevel: 'danger',  handler: () => {} },
  { id: 'sec-suspicious',    title: 'View Suspicious Activity', category: 'Security',       keywords: ['suspicious', 'activity', 'security'],    icon: <AlertTriangle className="h-4 w-4" />, dangerLevel: 'safe',   handler: () => {} },
]

interface ConfirmState {
  command: CommandItem
  reason: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (cmd.dangerLevel !== 'safe') {
      setConfirm({ command: cmd, reason: '' })
    } else {
      cmd.handler()
      onClose()
    }
  }, [onClose])

  const handleConfirm = () => {
    if (!confirm) return
    confirm.command.handler()
    setConfirm(null)
    onClose()
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelected(0)
      setConfirm(null)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && !confirm) { e.preventDefault(); if (flat[selected]) handleSelect(flat[selected]) }
      if (e.key === 'Escape') { if (confirm) setConfirm(null); else onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selected, flat, confirm, handleSelect, onClose])

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
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <AnimatePresence mode="wait">
              {confirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        background: dangerConfig[confirm.command.dangerLevel].bg,
                        color: dangerConfig[confirm.command.dangerLevel].color,
                        border: `1px solid ${dangerConfig[confirm.command.dangerLevel].color}30`,
                      }}>
                      {confirm.command.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{confirm.command.title}</p>
                      <p className="text-xs text-white/40">
                        {confirm.command.dangerLevel === 'danger' ? '⚠️ Destructive action — requires reason' : 'Confirm this action'}
                      </p>
                    </div>
                  </div>
                  {confirm.command.dangerLevel === 'danger' && (
                    <input
                      autoFocus
                      placeholder="Reason for this action..."
                      value={confirm.reason}
                      onChange={e => setConfirm(s => s ? { ...s, reason: e.target.value } : null)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 mb-4"
                    />
                  )}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConfirm(null)}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={confirm.command.dangerLevel === 'danger' && !confirm.reason.trim()}
                      className="rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-30"
                      style={{
                        background: dangerConfig[confirm.command.dangerLevel].bg,
                        color: dangerConfig[confirm.command.dangerLevel].color,
                        border: `1px solid ${dangerConfig[confirm.command.dangerLevel].color}40`,
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                    <Search className="h-4 w-4 shrink-0 text-white/30" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => { setQuery(e.target.value); setSelected(0) }}
                      placeholder="Search commands..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                    />
                    <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1">
                      <Command className="h-3 w-3 text-white/25" />
                      <span className="text-xs text-white/25">/</span>
                    </div>
                  </div>

                  <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                    {Object.entries(grouped).map(([category, commands]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 px-4 py-2 sticky top-0"
                          style={{ background: '#0a0a0f' }}>
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
                          const dcfg = dangerConfig[cmd.dangerLevel]

                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleSelect(cmd)}
                              onMouseEnter={() => setSelected(globalIndex)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                              style={{
                                background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                                borderLeft: isSelected ? '2px solid rgba(124,58,237,0.6)' : '2px solid transparent',
                              }}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: dcfg.bg || 'rgba(255,255,255,0.05)', color: dcfg.color }}>
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium" style={{ color: dcfg.color }}>
                                  {cmd.title}
                                </span>
                                {cmd.subtitle && (
                                  <span className="ml-2 text-xs text-white/25">{cmd.subtitle}</span>
                                )}
                              </div>
                              {cmd.shortcut && (
                                <div className="flex items-center gap-1">
                                  {cmd.shortcut.map((k, i) => (
                                    <span key={i} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {cmd.dangerLevel !== 'safe' && (
                                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                                  style={{ background: dcfg.bg, color: dcfg.color, border: `1px solid ${dcfg.color}30` }}>
                                  {cmd.dangerLevel}
                                </span>
                              )}
                              {isSelected && <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <div className="py-12 text-center text-sm text-white/25">
                        No commands found for "{query}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2.5">
                    {[
                      { keys: ['↑', '↓'], label: 'Navigate' },
                      { keys: ['↵'],      label: 'Execute' },
                      { keys: ['Esc'],    label: 'Close' },
                    ].map(({ keys, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        {keys.map(k => (
                          <span key={k} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">{k}</span>
                        ))}
                        <span className="text-[10px] text-white/20">{label}</span>
                      </div>
                    ))}
                    <span className="ml-auto text-[10px] text-white/15">{filtered.length} commands</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}