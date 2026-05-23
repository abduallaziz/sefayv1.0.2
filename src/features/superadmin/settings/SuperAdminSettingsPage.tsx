'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Bell, Database, Save, Eye, EyeOff, Copy, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'profile' | 'security' | 'notifications' | 'system'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile',       label: 'الملف الشخصي', icon: User },
  { key: 'security',      label: 'الأمان',        icon: Shield },
  { key: 'notifications', label: 'الإشعارات',     icon: Bell },
  { key: 'system',        label: 'النظام',         icon: Database },
]

export function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">الإعدادات</h1>
        <p className="text-white/40 text-sm mt-0.5">إدارة إعدادات حساب السوبر أدمن</p>
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
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
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
  const [saved, setSaved] = useState(false)
  return (
    <Card title="الملف الشخصي" description="بياناتك الأساسية كسوبر أدمن">
      <div className="space-y-4">
        <Field label="الاسم"><input defaultValue="Super Admin" className={inputCls} /></Field>
        <Field label="البريد الإلكتروني"><input defaultValue="admin@sefay.com" type="email" dir="ltr" className={inputCls} /></Field>
        <Field label="رقم الجوال"><input defaultValue="+966 5x xxx xxxx" dir="ltr" className={inputCls} /></Field>
      </div>
      <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
    </Card>
  )
}

function SecurityTab() {
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [saved, setSaved]       = useState(false)

  return (
    <div className="space-y-4">
      <Card title="تغيير كلمة المرور" description="يُنصح بتغييرها كل 90 يوم">
        <div className="space-y-4">
          <Field label="كلمة المرور الحالية"><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
          <Field label="كلمة المرور الجديدة"><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
          <Field label="تأكيد كلمة المرور"><PassInput show={showPass} onToggle={() => setShowPass(!showPass)} /></Field>
        </div>
        <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} label="تحديث كلمة المرور" />
      </Card>

      <Card title="مفتاح API" description="للوصول إلى API السوبر أدمن">
        <div className="flex items-center gap-2">
          <input readOnly dir="ltr" value="sk-sa-••••••••••••••••••••••••••••" className={cn(inputCls, 'flex-1 font-mono text-xs')} />
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </Card>

      <Card title="الجلسات النشطة" description="أجهزة مسجّلة دخول حالياً">
        <div className="space-y-2">
          {[
            { device: 'Chrome — Windows 11', ip: '197.x.x.x', time: 'الآن',       current: true },
            { device: 'Safari — iPhone 15',  ip: '197.x.x.x', time: 'منذ يومين', current: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <div>
                <p className="text-white text-sm">{s.device}</p>
                <p className="text-white/40 text-xs">{s.ip} · {s.time}</p>
              </div>
              {s.current
                ? <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">الجلسة الحالية</span>
                : <button className="text-xs text-red-400 hover:text-red-300 transition-colors">إلغاء</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function NotificationsTab() {
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    newTenant: true, trialExpiring: true, paymentFailed: true, systemAlert: true, weeklyReport: false,
  })
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }))
  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'newTenant',     label: 'تسجيل tenant جديد', desc: 'عند تسجيل أي عميل جديد' },
    { key: 'trialExpiring', label: 'انتهاء التجربة',     desc: 'قبل 3 أيام من انتهاء الـ trial' },
    { key: 'paymentFailed', label: 'فشل الدفع',          desc: 'عند فشل أي عملية دفع' },
    { key: 'systemAlert',   label: 'تنبيهات النظام',     desc: 'أخطاء وتحذيرات النظام' },
    { key: 'weeklyReport',  label: 'تقرير أسبوعي',       desc: 'ملخص أسبوعي بالأرقام' },
  ]
  return (
    <Card title="الإشعارات" description="حدّد متى تصلك الإشعارات">
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
            <div>
              <p className="text-white text-sm">{item.label}</p>
              <p className="text-white/40 text-xs">{item.desc}</p>
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
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-4">
      <Card title="معلومات النظام" description="بيانات البيئة الحالية">
        <div className="space-y-1">
          {[
            { label: 'الإصدار',           value: 'Sefay V1.02' },
            { label: 'البيئة',            value: 'Production' },
            { label: 'قاعدة البيانات',    value: 'Supabase PostgreSQL' },
            { label: 'الاستضافة',         value: 'Railway + Vercel' },
            { label: 'آخر نشر',           value: 'اليوم 09:40' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-white/40 text-sm">{row.label}</span>
              <span className="text-white text-sm font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="الإعدادات العامة" description="تطبّق على كل التيننتس">
        <div className="space-y-4">
          <Field label="مدة التجربة الافتراضية (أيام)"><input defaultValue="14" type="number" dir="ltr" className={inputCls} /></Field>
          <Field label="Grace Period بعد انتهاء الاشتراك (أيام)"><input defaultValue="3" type="number" dir="ltr" className={inputCls} /></Field>
          <Field label="الحد الأقصى لمحاولات تسجيل الدخول"><input defaultValue="5" type="number" dir="ltr" className={inputCls} /></Field>
        </div>
        <SaveBtn saved={saved} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
      </Card>
    </div>
  )
}

// ── Shared ──
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141720] border border-[#1e2130] rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-white font-medium">{title}</h2>
        <p className="text-white/40 text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-sm">{label}</label>
      {children}
    </div>
  )
}

function PassInput({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} dir="ltr" placeholder="••••••••" className={cn(inputCls, 'pe-10')} />
      <button type="button" onClick={onToggle} className="absolute end-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn('relative w-10 h-5 rounded-full transition-colors duration-200', checked ? 'bg-indigo-500' : 'bg-white/10')}>
      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', checked ? 'start-5' : 'start-0.5')} />
    </button>
  )
}

function SaveBtn({ saved, onClick, label = 'حفظ التغييرات' }: { saved: boolean; onClick: () => void; label?: string }) {
  return (
    <div className="flex justify-end pt-2">
      <button onClick={onClick} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white')}>
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'تم الحفظ' : label}
      </button>
    </div>
  )
}

const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 transition-colors'