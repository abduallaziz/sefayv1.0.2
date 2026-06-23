'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/* ─── Scroll Reveal ─────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, className = '', delay = 0, style }: {
  children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties
}) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 0.6s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.6s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── SVG Icons ─────────────────────────────────────────── */
const IC = ({ d, children, ...p }: { d?: string; children?: React.ReactNode; [k: string]: unknown }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em', display: 'block', flexShrink: 0 }} {...p}>
    {d ? <path d={d} /> : children}
  </svg>
)

/* ─── Lang Switcher ─────────────────────────────────────── */
function LangSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const toggle = () => {
    const next = locale === 'ar' ? 'en' : 'ar'
    router.push(pathname.replace(`/${locale}`, `/${next}`))
  }
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-[6px] px-3 py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer border transition-all"
      style={{ color: 'rgba(255,255,255,.9)', background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.25)', backdropFilter: 'blur(10px)', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.45)'; e.currentTarget.style.background = 'rgba(255,255,255,.2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; e.currentTarget.style.background = 'rgba(255,255,255,.1)' }}
    >
      <IC style={{ width: 15, height: 15 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </IC>
      {locale === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}

/* ─── LandingPage ───────────────────────────────────────── */
export function LandingPage() {
  const locale = useLocale()
  const t = useTranslations('landing')
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const goSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  const toggleLang = () => {
    const next = locale === 'ar' ? 'en' : 'ar'
    router.push(pathname.replace(`/${locale}`, `/${next}`))
    setMobileOpen(false)
  }

  /* ── Data ── */
  const FEATURES = [
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 9h20M6 14h4" /></IC>,
      grad: 'linear-gradient(135deg,#1565C0,#0C447C)',
      label: t('features.pos'), desc: t('features.posDesc'),
    },
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></IC>,
      grad: 'linear-gradient(135deg,#10B981,#059669)',
      label: t('features.inventory'), desc: t('features.inventoryDesc'),
    },
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IC>,
      grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
      label: t('features.reports'), desc: t('features.reportsDesc'),
    },
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" /></IC>,
      grad: 'linear-gradient(135deg,#F59E0B,#D97706)',
      label: t('features.invoices'), desc: t('features.invoicesDesc'),
    },
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></IC>,
      grad: 'linear-gradient(135deg,#EC4899,#DB2777)',
      label: t('features.loyalty'), desc: t('features.loyaltyDesc'),
    },
    {
      icon: <IC style={{ width: 25, height: 25, color: '#fff', strokeWidth: 2.1 }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></IC>,
      grad: 'linear-gradient(135deg,#06B6D4,#0891B2)',
      label: t('features.offline'), desc: t('features.offlineDesc'),
    },
  ]

  const BUSINESS = [
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></IC>,
      grad: 'linear-gradient(135deg,#F59E0B,#D97706)',
      label: t('business.restaurants'), sub: t('business.restaurantsSub'),
    },
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" /></IC>,
      grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
      label: t('business.cafes'), sub: t('business.cafesSub'),
    },
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></IC>,
      grad: 'linear-gradient(135deg,#10B981,#059669)',
      label: t('business.groceries'), sub: t('business.groceriesSub'),
    },
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><path d="M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4M19 5a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4M12 12v4M8 21h8M12 16v5" /></IC>,
      grad: 'linear-gradient(135deg,#EF4444,#DC2626)',
      label: t('business.pharmacies'), sub: t('business.pharmaciesSub'),
    },
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" /></IC>,
      grad: 'linear-gradient(135deg,#EC4899,#DB2777)',
      label: t('business.clothing'), sub: t('business.clothingSub'),
    },
    {
      icon: <IC style={{ width: 27, height: 27, color: '#fff' }}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 3.9C1.7 12.3 1 13.1 1 14v2c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></IC>,
      grad: 'linear-gradient(135deg,#06B6D4,#0891B2)',
      label: t('business.carwash'), sub: t('business.carwashSub'),
    },
  ]

  const TESTIMONIALS = [
    { q: t('testimonials.q1'), name: t('testimonials.n1'), role: t('testimonials.r1'), init: 'خ', grad: 'linear-gradient(135deg,#1565C0,#0C447C)' },
    { q: t('testimonials.q2'), name: t('testimonials.n2'), role: t('testimonials.r2'), init: 'ن', grad: 'linear-gradient(135deg,#10B981,#059669)' },
    { q: t('testimonials.q3'), name: t('testimonials.n3'), role: t('testimonials.r3'), init: 'ع', grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
  ]

  const TRUST = [
    { v: t('trust.stat1v'), l: t('trust.stat1l') },
    { v: t('trust.stat2v'), l: t('trust.stat2l') },
    { v: t('trust.stat3v'), l: t('trust.stat3l') },
    { v: t('trust.stat4v'), l: t('trust.stat4l') },
  ]

  const NAV = [
    { label: t('nav.features'), id: 'features' },
    { label: t('nav.business'), id: 'business' },
    { label: t('nav.pricing'), id: 'pricing' },
    { label: t('nav.testimonials'), id: 'testimonials' },
  ]

  const BARS = [55, 42, 70, 85, 60, 95, 78]

  const sectionTag = (icon: React.ReactNode, label: string) => (
    <div className="inline-flex items-center gap-[7px] rounded-[30px] px-[14px] py-[6px] text-[13px] font-semibold mb-[18px]"
      style={{ background: '#F5F8FC', border: '1px solid #E4EAF2', color: '#0C447C', borderInlineEnd: '3px solid #0C447C' }}>
      <span style={{ width: 14, height: 14, display: 'flex' }}>{icon}</span>
      {label}
    </div>
  )

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif", color: '#0A1628', fontSize: 15, lineHeight: 1.6 }}>

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 inset-x-0 z-40 transition-all duration-300"
        style={{
          background: 'linear-gradient(115deg,#082F5C 0%,#0C447C 42%,#1761B8 100%)',
          padding: scrolled ? '10px 0' : '14px 0',
          boxShadow: scrolled
            ? '0 4px 20px rgba(8,47,92,.5)'
            : '0 6px 28px rgba(8,47,92,.42),0 1px 0 rgba(255,255,255,.1) inset',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-6">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-[10px] cursor-pointer bg-none border-none">
            <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.28),rgba(255,255,255,.12))', border: '1px solid rgba(255,255,255,.3)', boxShadow: '0 2px 10px rgba(0,0,0,.18)' }}>
              <svg viewBox="0 0 24 24" style={{ width: 21, height: 21, fill: '#fff', stroke: 'none' }}><path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" /></svg>
            </div>
            <span className="text-[21px] font-bold text-white" style={{ letterSpacing: '-.5px' }}>Sefay</span>
          </button>

          {/* Nav links — me-auto يدفعهم لليسار في RTL وليمين في LTR */}
          <div className="hidden md:flex items-center gap-1 me-auto">
            {NAV.map(n => (
              <button key={n.id} onClick={() => goSection(n.id)}
                className="relative px-[14px] py-2 rounded-[9px] text-[14px] font-medium cursor-pointer border-none bg-transparent"
                style={{ color: 'rgba(255,255,255,.85)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff', e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.85)', e.currentTarget.style.background = 'transparent')}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-[10px]">
            <LangSwitcher />
            <button onClick={() => router.push(`/${locale}/login`)}
              className="px-[18px] py-[9px] rounded-[10px] text-[14px] font-semibold cursor-pointer border transition-all"
              style={{ color: 'rgba(255,255,255,.95)', background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.25)', backdropFilter: 'blur(10px)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.5)', e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)', e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
            >
              {t('nav.login')}
            </button>
            <button onClick={() => router.push(`/${locale}/onboarding`)}
              className="px-[20px] py-[10px] rounded-[10px] text-[14px] font-semibold cursor-pointer border-none transition-all hover:-translate-y-px"
              style={{ color: '#0C447C', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}
            >
              {t('nav.startFree')}
            </button>
          </div>

          {/* Burger */}
          <button className="md:hidden ms-auto text-white cursor-pointer bg-none border-none p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            <IC style={{ width: 24, height: 24 }}>{mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}</IC>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,.1)', background: '#082F5C' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => goSection(n.id)} className="block w-full text-start py-3 text-[15px] font-medium border-none bg-transparent cursor-pointer" style={{ color: 'rgba(255,255,255,.8)' }}>{n.label}</button>
            ))}
            <button onClick={toggleLang} className="block w-full text-start py-3 text-[15px] font-medium border-none bg-transparent cursor-pointer" style={{ color: 'rgba(255,255,255,.8)' }}>
              {locale === 'ar' ? 'English' : 'عربي'}
            </button>
            <div className="flex gap-2 pt-3">
              <button onClick={() => { router.push(`/${locale}/login`); setMobileOpen(false) }} className="flex-1 py-2 rounded-[10px] text-[14px] font-medium border cursor-pointer" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' }}>{t('nav.login')}</button>
              <button onClick={() => { router.push(`/${locale}/onboarding`); setMobileOpen(false) }} className="flex-1 py-2 rounded-[10px] text-[14px] font-semibold border-none cursor-pointer" style={{ color: '#0C447C', background: '#fff' }}>{t('nav.startFree')}</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ paddingTop: 140, paddingBottom: 90 }}>
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: 'linear-gradient(#EEF2F7 1px,transparent 1px),linear-gradient(90deg,#EEF2F7 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%,#000,transparent 75%)',
          opacity: .5,
        }} />
        <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(900px 500px at 80% -10%,rgba(37,99,235,.1),transparent 55%),radial-gradient(700px 500px at 10% 20%,rgba(12,68,124,.06),transparent 50%)' }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-[30px] px-[16px] py-[7px] text-[13px] font-medium mb-7" style={{ background: '#F5F8FC', border: '1px solid #E4EAF2', color: '#0C447C', boxShadow: '0 1px 3px rgba(10,22,40,.06)' }}>
            <span className="rounded-[20px] px-[9px] py-[2px] text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>{t('hero.badgePill')}</span>
            {t('hero.badge')}
            <IC style={{ width: 15, height: 15 }}><polyline points="9 18 15 12 9 6" /></IC>
          </div>

          <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginBottom: 22, color: '#0A1628', animation: 'heroIn .8s .1s cubic-bezier(.4,0,.2,1) backwards' }}>
            <style>{`@keyframes heroIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
            {t('hero.title')}<br />
            <span style={{ background: 'linear-gradient(120deg,#0C447C,#2671C4 60%,#3B82F6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('hero.titleGrad')}
            </span>
          </h1>

          <p style={{ fontSize: 19, color: '#54657C', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.6, animation: 'heroIn .8s .22s cubic-bezier(.4,0,.2,1) backwards' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex items-center justify-center gap-[14px] flex-wrap mb-[18px]" style={{ animation: 'heroIn .8s .34s cubic-bezier(.4,0,.2,1) backwards' }}>
            <button onClick={() => router.push(`/${locale}/onboarding`)}
              className="inline-flex items-center gap-2 transition-all hover:-translate-y-px"
              style={{ padding: '14px 28px', borderRadius: 13, fontSize: 16, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#0C447C,#1565C0)', border: 'none', cursor: 'pointer', boxShadow: '0 6px 18px rgba(12,68,124,.3),0 2px 6px rgba(12,68,124,.22)', fontFamily: 'inherit' }}
            >
              {t('hero.cta')}
              <IC style={{ width: 16, height: 16 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></IC>
            </button>
            <button onClick={() => goSection('features')}
              className="inline-flex items-center gap-2 transition-all hover:bg-[#F5F8FC]"
              style={{ padding: '14px 28px', borderRadius: 13, fontSize: 16, fontWeight: 600, color: '#0C447C', background: 'transparent', border: '1.5px solid #E4EAF2', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <IC style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></IC>
              {t('hero.demo')}
            </button>
          </div>

          <div className="flex items-center justify-center gap-[18px] flex-wrap text-[13px]" style={{ color: '#8C9CB2', animation: 'heroIn .8s .44s cubic-bezier(.4,0,.2,1) backwards' }}>
            {[t('hero.note1'), t('hero.note2'), t('hero.note3')].map(n => (
              <span key={n} className="inline-flex items-center gap-[6px]">
                <IC style={{ width: 15, height: 15, color: '#10B981' }}><polyline points="20 6 9 17 4 12" /></IC>
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative z-10 max-w-[980px] mx-auto px-6 mt-[60px]" style={{ animation: 'heroIn 1s .3s cubic-bezier(.4,0,.2,1) backwards' }}>
          <div className="rounded-[20px] p-[10px] relative" style={{ background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 30px 80px rgba(12,68,124,.35),0 12px 32px rgba(12,68,124,.25)' }}>
            <div className="flex items-center gap-[7px] px-3 py-2">
              {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} className="w-[11px] h-[11px] rounded-full" style={{ background: c }} />)}
            </div>
            <div className="rounded-[13px] overflow-hidden relative" style={{ background: '#F5F8FC', aspectRatio: '16/9.5' }}>
              <div className="absolute inset-0 p-4 flex gap-3">
                <div className="w-[30%] bg-white rounded-[10px] p-3 flex flex-col gap-[7px]" style={{ boxShadow: '0 1px 3px rgba(10,22,40,.06)' }}>
                  {[true, false, false, false, false, false].map((on, i) => (
                    <div key={i} className="h-[30px] rounded-[7px] flex items-center px-[10px] gap-2" style={{ background: on ? 'linear-gradient(135deg,#0C447C,#1565C0)' : '#EEF3F9' }}>
                      <div className="w-[14px] h-[14px] rounded-[4px]" style={{ background: on ? 'rgba(255,255,255,.4)' : '#E4EAF2' }} />
                      <div className="flex-1 h-[6px] rounded-[4px]" style={{ background: on ? 'rgba(255,255,255,.5)' : '#E4EAF2' }} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-[10px]">
                    {[
                      { grad: 'linear-gradient(90deg,#0C447C,#3B82F6)', ico: 'linear-gradient(135deg,#1565C0,#0C447C)' },
                      { grad: 'linear-gradient(90deg,#059669,#34D399)', ico: 'linear-gradient(135deg,#10B981,#059669)' },
                      { grad: 'linear-gradient(90deg,#7C3AED,#A78BFA)', ico: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
                    ].map((c, i) => (
                      <div key={i} className="bg-white rounded-[10px] p-3 relative overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(10,22,40,.06)' }}>
                        <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: c.grad }} />
                        <div className="w-[26px] h-[26px] rounded-[8px] mb-2" style={{ background: c.ico }} />
                        <div className="h-[13px] w-[60%] rounded-[5px] mb-1" style={{ background: '#0A1628', opacity: .85 }} />
                        <div className="h-[6px] w-[80%] rounded-[4px]" style={{ background: '#E4EAF2' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-white rounded-[10px] p-[14px] flex items-end gap-2" style={{ boxShadow: '0 1px 3px rgba(10,22,40,.06)' }}>
                    {BARS.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-[6px]" style={{ height: `${h}%`, background: 'linear-gradient(180deg,#1565C0,rgba(21,101,192,.2))', animation: `barGrow .8s ${.1 + i * .08}s cubic-bezier(.4,0,.2,1) backwards`, transformOrigin: 'bottom' }} />
                    ))}
                    <style>{`@keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-[18%] -end-[4%] hidden lg:flex items-center gap-[10px] bg-white rounded-[12px] px-[15px] py-[11px]"
            style={{ boxShadow: '0 8px 30px rgba(12,68,124,.13),0 2px 8px rgba(10,22,40,.07)', border: '1px solid rgba(12,68,124,.1)', animation: 'float 3.5s ease-in-out infinite' }}>
            <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
            <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              <IC style={{ width: 17, height: 17, color: '#fff' }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></IC>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0A1628]">+12.4%</div>
              <div className="text-[11px] text-[#8C9CB2]">{t('hero.salesGrowth')}</div>
            </div>
          </div>
          <div className="absolute bottom-[14%] -start-[3%] hidden lg:flex items-center gap-[10px] bg-white rounded-[12px] px-[15px] py-[11px]"
            style={{ boxShadow: '0 8px 30px rgba(12,68,124,.13),0 2px 8px rgba(10,22,40,.07)', border: '1px solid rgba(12,68,124,.1)', animation: 'float 3.5s 1.5s ease-in-out infinite' }}>
            <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1565C0,#0C447C)' }}>
              <IC style={{ width: 17, height: 17, color: '#fff' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></IC>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0A1628]">347</div>
              <div className="text-[11px] text-[#8C9CB2]">{t('hero.ordersToday')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST / STATS ── */}
      <section style={{ padding: '50px 0', borderBottom: '1px solid #EEF2F7' }}>
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <p className="text-[13px] font-semibold mb-7" style={{ color: '#8C9CB2', letterSpacing: '.05em' }}>{t('trust.label')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1, lineHeight: 1, background: 'linear-gradient(120deg,#0C447C,#2671C4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.v}</div>
                <div style={{ fontSize: 14, color: '#54657C', marginTop: 6 }}>{s.l}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '90px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal className="text-center" style={{ maxWidth: 640, margin: '0 auto 56px' }}>
            {sectionTag(<IC><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></IC>, t('features.tag'))}
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 16, color: '#0A1628' }}>{t('features.heading')}</h2>
            <p style={{ fontSize: 17, color: '#54657C', lineHeight: 1.6 }}>{t('features.sub')}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 70}>
                <div
                  className="transition-all duration-300 hover:-translate-y-1"
                  style={{ background: '#fff', border: '1px solid #E4EAF2', borderRadius: 18, padding: 28, height: '100%', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 16px rgba(10,22,40,.05),0 20px 48px rgba(10,22,40,.12)'; e.currentTarget.style.borderColor = 'transparent' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#E4EAF2' }}
                >
                  <div className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center mb-5" style={{ background: f.grad, boxShadow: '0 1px 3px rgba(10,22,40,.06),0 1px 0 rgba(255,255,255,.5) inset' }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0A1628' }}>{f.label}</h3>
                  <p style={{ fontSize: 14, color: '#54657C', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUSINESS TYPES ── */}
      <section id="business" style={{ padding: '90px 0', background: '#F5F8FC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal className="text-center" style={{ maxWidth: 640, margin: '0 auto 56px' }}>
            {sectionTag(<IC><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /></IC>, t('business.tag'))}
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 16, color: '#0A1628' }}>{t('business.heading')}</h2>
            <p style={{ fontSize: 17, color: '#54657C', lineHeight: 1.6 }}>{t('business.sub')}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUSINESS.map((b, i) => (
              <Reveal key={i} delay={i * 60}>
                <div
                  className="transition-all duration-300 hover:-translate-y-[3px] cursor-pointer"
                  style={{ background: '#fff', border: '1px solid #E4EAF2', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(10,22,40,.03),0 8px 24px rgba(10,22,40,.07)'; e.currentTarget.style.borderColor = '#0C447C' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#E4EAF2' }}
                >
                  <div className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: b.grad }}>
                    {b.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{b.label}</h4>
                    <p style={{ fontSize: 13, color: '#8C9CB2' }}>{b.sub}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '90px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal className="text-center" style={{ maxWidth: 640, margin: '0 auto 56px' }}>
            {sectionTag(<IC><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></IC>, t('pricing.tag'))}
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 16, color: '#0A1628' }}>{t('pricing.heading')}</h2>
            <p style={{ fontSize: 17, color: '#54657C', lineHeight: 1.6 }}>{t('pricing.sub')}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            <Reveal>
              <div className="relative flex flex-col h-full transition-all hover:shadow-md" style={{ background: '#fff', border: '1.5px solid #E4EAF2', borderRadius: 18, padding: 32 }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{t('pricing.starter')}</div>
                <div style={{ fontSize: 13, color: '#8C9CB2', marginBottom: 22, minHeight: 38 }}>{t('pricing.starterDesc')}</div>
                <div className="flex items-baseline gap-[6px] mb-[6px]">
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, color: '#0A1628' }}>{t('pricing.starterPrice')}</span>
                  <span style={{ fontSize: 14, color: '#8C9CB2' }}>{t('pricing.sar')} / {t('pricing.perMonth')}</span>
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 24 }}>{t('pricing.save')}</div>
                <ul className="flex flex-col gap-[13px] mb-7 flex-1" style={{ listStyle: 'none' }}>
                  {[t('pricing.starterF1'), t('pricing.starterF2'), t('pricing.starterF3'), t('pricing.starterF4')].map(f => (
                    <li key={f} className="flex items-center gap-[10px] text-[14px]" style={{ color: '#54657C' }}>
                      <IC style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></IC>{f}
                    </li>
                  ))}
                  <li className="flex items-center gap-[10px] text-[14px]" style={{ color: '#B4C0CF' }}>
                    <IC style={{ width: 18, height: 18, color: '#B4C0CF', flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></IC>{t('pricing.starterF5off')}
                  </li>
                </ul>
                <button onClick={() => router.push(`/${locale}/onboarding`)} className="w-full py-[11px] rounded-[10px] text-[14px] font-semibold border cursor-pointer transition-all hover:border-[#0C447C] hover:bg-[#F5F8FC]" style={{ color: '#0C447C', background: 'transparent', borderColor: '#E4EAF2', fontFamily: 'inherit' }}>
                  {t('pricing.startNow')}
                </button>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="relative flex flex-col h-full" style={{ borderRadius: 18, padding: 32, border: '1.5px solid #0C447C', transform: 'scale(1.03)', boxShadow: '0 8px 16px rgba(10,22,40,.05),0 20px 48px rgba(10,22,40,.12)' }}>
                <div className="absolute inset-[-2px] rounded-[20px] -z-10" style={{ background: 'linear-gradient(135deg,#0C447C,#3B82F6,#0C447C,#2671C4)', backgroundSize: '300% 300%', animation: 'gradMove 4s linear infinite' }} />
                <style>{`@keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
                <div className="absolute -top-[13px] start-1/2 px-[16px] py-[5px] rounded-[20px] text-[12px] font-bold text-white whitespace-nowrap" style={{ background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 6px 18px rgba(12,68,124,.3)', transform: 'translateX(-50%)' }}>
                  {t('pricing.popular')}
                </div>
                <div className="absolute inset-0 rounded-[18px] bg-white -z-[5]" />
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, position: 'relative' }}>{t('pricing.pro')}</div>
                <div style={{ fontSize: 13, color: '#8C9CB2', marginBottom: 22, minHeight: 38, position: 'relative' }}>{t('pricing.proDesc')}</div>
                <div className="flex items-baseline gap-[6px] mb-[6px]" style={{ position: 'relative' }}>
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, color: '#0A1628' }}>{t('pricing.proPrice')}</span>
                  <span style={{ fontSize: 14, color: '#8C9CB2' }}>{t('pricing.sar')} / {t('pricing.perMonth')}</span>
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 24, position: 'relative' }}>{t('pricing.save')}</div>
                <ul className="flex flex-col gap-[13px] mb-7 flex-1" style={{ listStyle: 'none', position: 'relative' }}>
                  {[t('pricing.proF1'), t('pricing.proF2'), t('pricing.proF3'), t('pricing.proF4'), t('pricing.proF5')].map(f => (
                    <li key={f} className="flex items-center gap-[10px] text-[14px]" style={{ color: '#54657C' }}>
                      <IC style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></IC>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/${locale}/onboarding`)} className="w-full py-[11px] rounded-[10px] text-[14px] font-semibold border-none cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px" style={{ color: '#fff', background: 'linear-gradient(135deg,#0C447C,#1565C0)', boxShadow: '0 6px 18px rgba(12,68,124,.3)', fontFamily: 'inherit', position: 'relative' }}>
                  {t('pricing.startTrial')}
                </button>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="relative flex flex-col h-full transition-all hover:shadow-md" style={{ background: '#fff', border: '1.5px solid #E4EAF2', borderRadius: 18, padding: 32 }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{t('pricing.enterprise')}</div>
                <div style={{ fontSize: 13, color: '#8C9CB2', marginBottom: 22, minHeight: 38 }}>{t('pricing.enterpriseDesc')}</div>
                <div className="flex items-baseline gap-[6px] mb-[6px]">
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, color: '#0A1628' }}>{t('pricing.entPrice')}</span>
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 24 }}>{t('pricing.customPrice')}</div>
                <ul className="flex flex-col gap-[13px] mb-7 flex-1" style={{ listStyle: 'none' }}>
                  {[t('pricing.entF1'), t('pricing.entF2'), t('pricing.entF3'), t('pricing.entF4'), t('pricing.entF5')].map(f => (
                    <li key={f} className="flex items-center gap-[10px] text-[14px]" style={{ color: '#54657C' }}>
                      <IC style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></IC>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/${locale}/onboarding`)} className="w-full py-[11px] rounded-[10px] text-[14px] font-semibold border cursor-pointer transition-all hover:border-[#0C447C] hover:bg-[#F5F8FC]" style={{ color: '#0C447C', background: 'transparent', borderColor: '#E4EAF2', fontFamily: 'inherit' }}>
                  {t('pricing.contactUs')}
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: '90px 0', background: '#F5F8FC' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal className="text-center" style={{ maxWidth: 640, margin: '0 auto 56px' }}>
            {sectionTag(<IC><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></IC>, t('testimonials.tag'))}
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.15, color: '#0A1628' }}>{t('testimonials.heading')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((ts, i) => (
              <Reveal key={i} delay={i * 70}>
                <div
                  className="relative overflow-hidden transition-all duration-300 hover:-translate-y-[3px]"
                  style={{ background: '#fff', border: '1px solid #E4EAF2', borderRadius: 18, padding: 26, height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(10,22,40,.03),0 8px 24px rgba(10,22,40,.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
                >
                  <div className="absolute -top-[14px] end-4 text-[88px] font-black leading-none pointer-events-none select-none" style={{ color: '#E4EAF2', fontFamily: 'Georgia,serif' }}>"</div>
                  <div className="flex gap-[3px] mb-4">
                    {Array(5).fill(0).map((_, j) => (
                      <svg key={j} viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#F59E0B', stroke: 'none' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    ))}
                  </div>
                  <p style={{ fontSize: 15, color: '#0A1628', lineHeight: 1.7, marginBottom: 20 }}>"{ts.q}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0" style={{ background: ts.grad }}>{ts.init}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{ts.name}</div>
                      <div style={{ fontSize: 12, color: '#8C9CB2' }}>{ts.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="relative rounded-[28px] text-center overflow-hidden" style={{ background: 'linear-gradient(125deg,#0C447C 0%,#1565C0 50%,#2671C4 100%)', padding: '64px 48px', boxShadow: '0 30px 70px rgba(12,68,124,.35)' }}>
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(180deg,#000,transparent)' }} />
            <div className="absolute -top-[50px] -end-[50px] w-[200px] h-[200px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,255,255,.1),transparent 70%)' }} />
            <div className="absolute -bottom-[60px] -start-[30px] w-[180px] h-[180px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(37,99,235,.3),transparent 70%)' }} />
            <Reveal>
              <h2 style={{ fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: -1, marginBottom: 16, position: 'relative' }}>{t('cta.heading')}</h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,.85)', maxWidth: 520, margin: '0 auto 32px', position: 'relative' }}>{t('cta.sub')}</p>
              <div className="flex items-center justify-center gap-[14px] flex-wrap" style={{ position: 'relative' }}>
                <button onClick={() => router.push(`/${locale}/onboarding`)}
                  className="inline-flex items-center gap-2 transition-all hover:-translate-y-[2px]"
                  style={{ padding: '14px 30px', borderRadius: 13, fontSize: 16, fontWeight: 600, color: '#0C447C', background: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,.2)', fontFamily: 'inherit' }}
                >
                  {t('cta.primary')}
                  <IC style={{ width: 16, height: 16 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></IC>
                </button>
                <button onClick={() => goSection('pricing')}
                  className="transition-all hover:bg-[rgba(255,255,255,.2)]"
                  style={{ padding: '14px 28px', borderRadius: 13, fontSize: 16, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.3)', cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'inherit' }}
                >
                  {t('cta.secondary')}
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A1628', color: '#fff', padding: '64px 0 32px' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-[10px] mb-4">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center" style={{ background: '#0C447C' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 21, height: 21, fill: '#fff', stroke: 'none' }}><path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" /></svg>
                </div>
                <span className="text-[21px] font-bold">Sefay</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', maxWidth: 280, lineHeight: 1.6 }}>{t('footer.tagline')}</p>
              <div className="flex gap-[10px] mt-5">
                {[
                  <IC key="tw"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></IC>,
                  <IC key="ig"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></IC>,
                  <IC key="li"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></IC>,
                ].map((ico, i) => (
                  <button key={i} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-all hover:-translate-y-[2px]" style={{ background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                    <span style={{ width: 18, height: 18, display: 'flex' }}>{ico}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{t('footer.product')}</h5>
              {[t('footer.features'), t('footer.pricing'), t('footer.app'), t('footer.updates')].map(l => (
                <a key={l} className="block text-[14px] mb-3 transition-all hover:text-white cursor-pointer" style={{ color: 'rgba(255,255,255,.55)' }}>{l}</a>
              ))}
            </div>
            <div>
              <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{t('footer.company')}</h5>
              {[t('footer.about'), t('footer.blog'), t('footer.careers'), t('footer.contact')].map(l => (
                <a key={l} className="block text-[14px] mb-3 transition-all hover:text-white cursor-pointer" style={{ color: 'rgba(255,255,255,.55)' }}>{l}</a>
              ))}
            </div>
            <div>
              <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{t('footer.support')}</h5>
              {[t('footer.help'), t('footer.faq'), t('footer.tech'), t('footer.status')].map(l => (
                <a key={l} className="block text-[14px] mb-3 transition-all hover:text-white cursor-pointer" style={{ color: 'rgba(255,255,255,.55)' }}>{l}</a>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 pt-7" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>© {new Date().getFullYear().toLocaleString('en-US')} Sefay. {t('footer.rights')}</span>
            <div className="flex gap-6">
              {[t('footer.privacy'), t('footer.terms'), t('footer.security')].map(l => (
                <a key={l} className="text-[13px] transition-colors hover:text-white cursor-pointer" style={{ color: 'rgba(255,255,255,.5)' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
