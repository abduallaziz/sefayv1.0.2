'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { User, Shield, Bell, Database, Save, Eye, EyeOff, Copy, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'profile' | 'security' | 'notifications' | 'system'

export function SuperAdminSettingsPage() {
  const t = useTranslations('superadmin.settings')
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profile',       label: t('tabs.profile'),       icon: User },
    { key: 'security',      label: t('tabs.security'),      icon: Shield },
    { key: 'notifications', label: t('tabs.notifications'), icon: Bell },
    { key: 'system',        label: t('tabs.system'),        icon: Database },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="flex gap-6">
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-right',
                    activeTab === tab.key
                      ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white'
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'profile'       && <ProfileTab />}
            {activeTab === 'security'      && <SecurityTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'system'        && <SystemTab />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  const t = useTranslations('superadmin.settings')
  const [saved, setSaved] = useState(false)
  return (
    <Card title={t('profile.title')} description={t('profile.description')}>
      <div className="space-y-4">
        <Field label={t('profile.name')}><input defaultValue="Super Admin" className={inputCls} /></Field>
        <Field label={t('profile.email')}><input defaultValue="admin@sefay.com" type="email" dir="ltr" className={inputCls} /></Field>
        <Field label={t('profile.phone')}><input defaultValue="+966 5x xxx xxxx" dir="ltr" className={inputCls} /></Field>
      </div>
      <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Card>
  )
}

function SecurityTab() {
  const t = useTranslations('superadmin.settings')
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const sessions = [
    { device: 'Chrome — Windows 11', ip: '197.x.x.x', time: t('security.now'),               current: true },
    { device: 'Safari — iPhone 15',  ip: '197.x.x.x', time: t('security.daysAgo', { count: 2 }), current: false },
  ]

  return (
    <div className="space-y-4">
      <Card title={t('security.changePasswordTitle')} description={t('security.changePasswordDesc')}>
        <div className="space-y-4">
          <Field label={t('security.currentPassword')}><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
          <Field label={t('security.newPassword')}><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
          <Field label={t('security.confirmPassword')}><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
        </div>
        <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} label={t('security.updatePassword')} />
      </Card>

      <Card title={t('security.apiKeyTitle')} description={t('security.apiKeyDesc')}>
        <div className="flex items-center gap-2">
          <input readOnly dir="ltr" value="sk-sa-••••••••••••••••••••••••••••" className={cn(inputCls, 'flex-1 font-mono text-xs')} />
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </Card>

      <Card title={t('security.sessionsTitle')} description={t('security.sessionsDesc')}>
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg">
              <div>
                <p className="text-slate-800 dark:text-white text-sm">{s.device}</p>
                <p className="text-slate-500 dark:text-white/40 text-xs">{s.ip} · {s.time}</p>
              </div>
              {s.current
                ? <span className="text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{t('security.currentSession')}</span>
                : <button className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">{t('security.revoke')}</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function NotificationsTab() {
  const t = useTranslations('superadmin.settings')
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    newTenant: true, trialExpiring: true, paymentFailed: true, systemAlert: true, weeklyReport: false,
  })
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }))
  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'newTenant',     label: t('notifications.newTenant'),     desc: t('notifications.newTenantDesc') },
    { key: 'trialExpiring', label: t('notifications.trialExpiring'), desc: t('notifications.trialExpiringDesc') },
    { key: 'paymentFailed', label: t('notifications.paymentFailed'), desc: t('notifications.paymentFailedDesc') },
    { key: 'systemAlert',   label: t('notifications.systemAlert'),   desc: t('notifications.systemAlertDesc') },
    { key: 'weeklyReport',  label: t('notifications.weeklyReport'),  desc: t('notifications.weeklyReportDesc') },
  ]
  return (
    <Card title={t('notifications.title')} description={t('notifications.description')}>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg">
            <div>
              <p className="text-slate-800 dark:text-white text-sm">{item.label}</p>
              <p className="text-slate-500 dark:text-white/40 text-xs">{item.desc}</p>
            </div>
            <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
      <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Card>
  )
}

function SystemTab() {
  const t = useTranslations('superadmin.settings')
  const [saved, setSaved] = useState(false)

  const infoRows = [
    { label: t('system.version'),     value: 'Sefay V1.02' },
    { label: t('system.environment'), value: 'Production' },
    { label: t('system.database'),    value: 'Supabase PostgreSQL' },
    { label: t('system.hosting'),     value: 'Railway + Vercel' },
    { label: t('system.lastDeploy'),  value: t('system.today', { time: '09:40' }) },
  ]

  return (
    <div className="space-y-4">
      <Card title={t('system.infoTitle')} description={t('system.infoDesc')}>
        <div className="space-y-1">
          {infoRows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
              <span className="text-slate-500 dark:text-white/40 text-sm">{row.label}</span>
              <span className="text-slate-800 dark:text-white text-sm font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('system.generalTitle')} description={t('system.generalDesc')}>
        <div className="space-y-4">
          <Field label={t('system.defaultTrialDays')}><input defaultValue="14" type="text" inputMode="numeric" lang="en" dir="ltr" className={inputCls} /></Field>
          <Field label={t('system.gracePeriod')}><input defaultValue="3" type="text" inputMode="numeric" lang="en" dir="ltr" className={inputCls} /></Field>
          <Field label={t('system.maxLoginAttempts')}><input defaultValue="5" type="text" inputMode="numeric" lang="en" dir="ltr" className={inputCls} /></Field>
        </div>
        <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
      </Card>
    </div>
  )
}

// ── Shared ──
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#141720] border border-slate-200 dark:border-[#1e2130] rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-slate-800 dark:text-white font-medium">{title}</h2>
        <p className="text-slate-500 dark:text-white/40 text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-600 dark:text-white/60 text-sm">{label}</label>
      {children}
    </div>
  )
}

function PassInput({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} dir="ltr" placeholder="••••••••" className={cn(inputCls, 'pe-10')} />
      <button type="button" onClick={onToggle} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn('relative w-10 h-5 rounded-full transition-colors duration-200', checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10')}>
      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', checked ? 'start-5' : 'start-0.5')} />
    </button>
  )
}

function SaveBtn({ saved, onClick, label }: { saved: boolean; onClick: () => void; label?: string }) {
  const t = useTranslations('superadmin.settings')
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onClick} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        saved ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white')}>
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? t('saved') : (label ?? t('save'))}
      </button>
    </div>
  )
}

const inputCls = 'w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 transition-colors'
