'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import {
  ShoppingCart, BarChart3, Users, Shield, Zap, Globe,
  Check, Star, ArrowRight, Menu, X,
  Utensils, ShoppingBag, Scissors, Heart, Smartphone, Home,
} from 'lucide-react'

/* ── Scroll reveal ───────────────────────────────────────── */
function useScrollReveal() {
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

function Reveal({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ── Auth Modal ──────────────────────────────────────────── */
function AuthModal({ mode, locale, onClose, onSwitch }: {
  mode: 'login' | 'register'
  locale: string
  onClose: () => void
  onSwitch: () => void
}) {
  const t = useTranslations('landing.auth')
  const isLogin = mode === 'login'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,47,92,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md bg-white shadow-xl overflow-hidden"
        style={{ animation: 'scaleIn 0.2s ease both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)' }}
        >
          <div>
            <p className="text-white/50 text-xs mb-0.5">Sefay</p>
            <h2 className="text-lg font-bold">{isLogin ? t('loginTitle') : t('registerTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('businessName')}</label>
              <input
                type="text"
                placeholder={t('businessPlaceholder')}
                className="w-full px-3 py-2.5 rounded-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand-primary transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full px-3 py-2.5 rounded-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand-primary transition-colors"
            />
          </div>

          <Link
            href={`/${locale}/login`}
            className="block w-full py-2.5 rounded-sm text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }}
            onClick={onClose}
          >
            {isLogin ? t('loginBtn') : t('registerBtn')}
          </Link>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={onSwitch} className="text-brand-primary font-medium hover:underline">
              {isLogin ? t('createOne') : t('loginLink')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── LandingPage ─────────────────────────────────────────── */
export function LandingPage() {
  const locale = useLocale()
  const t = useTranslations('landing')
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<'login' | 'register' | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const FEATURES = [
    { icon: ShoppingCart, label: t('features.pos'),       desc: t('features.posDesc') },
    { icon: BarChart3,    label: t('features.reports'),   desc: t('features.reportsDesc') },
    { icon: Users,        label: t('features.customers'), desc: t('features.customersDesc') },
    { icon: Shield,       label: t('features.zatca'),     desc: t('features.zatcaDesc') },
    { icon: Zap,          label: t('features.shifts'),    desc: t('features.shiftsDesc') },
    { icon: Globe,        label: t('features.branches'),  desc: t('features.branchesDesc') },
  ]

  const SECTORS = [
    { icon: Utensils,    label: t('sectors.restaurants') },
    { icon: ShoppingBag, label: t('sectors.retail') },
    { icon: Scissors,    label: t('sectors.salons') },
    { icon: Heart,       label: t('sectors.health') },
    { icon: Smartphone,  label: t('sectors.electronics') },
    { icon: Home,        label: t('sectors.furniture') },
  ]

  const PLANS = [
    {
      name: t('pricing.basic'), price: 99, featured: false,
      features: [t('pricing.basicF1'), t('pricing.basicF2'), t('pricing.basicF3'), t('pricing.basicF4')],
    },
    {
      name: t('pricing.pro'), price: 199, featured: true,
      features: [t('pricing.proF1'), t('pricing.proF2'), t('pricing.proF3'), t('pricing.proF4'), t('pricing.proF5'), t('pricing.proF6')],
    },
    {
      name: t('pricing.enterprise'), price: 399, featured: false,
      features: [t('pricing.entF1'), t('pricing.entF2'), t('pricing.entF3'), t('pricing.entF4'), t('pricing.entF5'), t('pricing.entF6')],
    },
  ]

  const STATS = [
    { value: '+500',     label: t('stats.businesses') },
    { value: '99.9%',   label: t('stats.uptime') },
    { value: '+50,000', label: t('stats.invoices') },
    { value: '6',       label: t('stats.sectors') },
  ]

  const NAV_LINKS = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.sectors'),  href: '#sectors' },
    { label: t('nav.pricing'),  href: '#pricing' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 inset-x-0 z-40 transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)',
          boxShadow: scrolled ? '0 2px 20px rgba(8,47,92,0.4)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-sm" style={{ background: 'rgba(255,255,255,0.18)' }}>S</div>
            <span className="text-white font-bold text-lg">Sefay</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="text-white/80 hover:text-white text-sm font-medium transition-colors relative group">
                {item.label}
                <span className="absolute -bottom-0.5 start-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-200" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setModal('login')}
              className="text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 rounded-sm hover:bg-white/10 transition-colors"
            >
              {t('nav.login')}
            </button>
            <button
              onClick={() => setModal('register')}
              className="text-brand-primary text-sm font-semibold px-4 py-1.5 rounded-sm hover:opacity-90 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.92)' }}
            >
              {t('nav.startFree')}
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3" style={{ background: '#082F5C' }}>
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="block text-white/80 hover:text-white text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setModal('login'); setMenuOpen(false) }}
                className="flex-1 text-white border border-white/30 text-sm font-medium py-2 rounded-sm hover:bg-white/10 transition-colors"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => { setModal('register'); setMenuOpen(false) }}
                className="flex-1 text-sm font-semibold py-2 rounded-sm text-brand-primary"
                style={{ background: 'rgba(255,255,255,0.92)' }}
              >
                {t('nav.startFree')}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative pt-32 pb-20 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #082F5C 0%, #0C447C 40%, #1565C0 80%, #2671C4 100%)' }}
      >
        <div className="absolute top-20 end-10 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 start-10 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('hero.badge')}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            {t('hero.title1')}<br />
            <span className="text-white/70">{t('hero.title2')}</span>
          </h1>

          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setModal('register')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-semibold text-brand-primary hover:opacity-90 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              {t('hero.cta')}
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => setModal('login')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              {t('hero.ctaLogin')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <Reveal key={i} className="text-center" delay={i * 80}>
              <p className="text-2xl font-bold text-brand-primary tabular-nums">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold text-brand-primary mb-2 uppercase tracking-wide">{t('features.title')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{t('features.heading')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <Reveal key={i} delay={i * 60}>
                  <div
                    className="bg-white border border-slate-100 rounded-md p-5 h-full hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                    style={{ borderTop: '3px solid #0C447C' }}
                  >
                    <div className="w-10 h-10 rounded-sm bg-brand-light flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-primary" strokeWidth={2} />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{f.label}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section id="sectors" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold text-brand-primary mb-2 uppercase tracking-wide">{t('sectors.title')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{t('sectors.heading')}</h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SECTORS.map((s, i) => {
              const Icon = s.icon
              return (
                <Reveal key={i} delay={i * 50}>
                  <div className="bg-white rounded-md p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all duration-200 border border-slate-100 group cursor-default">
                    <div className="w-12 h-12 rounded-sm bg-brand-light group-hover:bg-brand transition-colors duration-200 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors duration-200" strokeWidth={2} />
                    </div>
                    <p className="text-xs font-medium text-slate-700">{s.label}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold text-brand-primary mb-2 uppercase tracking-wide">{t('pricing.title')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{t('pricing.heading')}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className={`rounded-md p-6 h-full flex flex-col transition-all duration-200 ${
                    plan.featured ? 'text-white' : 'bg-white border border-slate-100 hover:border-brand-primary/30 hover:shadow-md'
                  }`}
                  style={plan.featured
                    ? { background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)', border: '2px solid rgba(255,255,255,0.15)' }
                    : { borderTop: '3px solid #0C447C' }
                  }
                >
                  {plan.featured && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star size={13} fill="currentColor" className="text-yellow-300" />
                      <span className="text-xs font-medium text-yellow-300">{t('pricing.popular')}</span>
                    </div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-slate-800'}`}>{plan.name}</h3>
                  <div className="mb-5">
                    <span className={`text-3xl font-bold tabular-nums ${plan.featured ? 'text-white' : 'text-brand-primary'}`}>{plan.price}</span>
                    <span className={`text-sm ms-1 ${plan.featured ? 'text-white/60' : 'text-slate-400'}`}>
                      SAR / {t('pricing.perMonth')}
                    </span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check size={14} strokeWidth={2.5} className={plan.featured ? 'text-green-300 shrink-0' : 'text-brand-primary shrink-0'} />
                        <span className={plan.featured ? 'text-white/80' : 'text-slate-600'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setModal('register')}
                    className={`w-full py-2.5 rounded-sm text-sm font-semibold transition-opacity hover:opacity-90 ${plan.featured ? 'text-brand-primary' : 'text-white'}`}
                    style={plan.featured
                      ? { background: 'rgba(255,255,255,0.92)' }
                      : { background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 100%)' }
                    }
                  >
                    {t('pricing.getStarted')}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section
        className="py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)' }}
      >
        <Reveal className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('cta.heading')}</h2>
          <p className="text-white/70 mb-8">{t('cta.sub')}</p>
          <button
            onClick={() => setModal('register')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-sm font-semibold text-brand-primary hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            {t('cta.button')}
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold text-xs" style={{ background: '#0C447C' }}>S</div>
            <span className="text-white font-semibold">Sefay</span>
            <span className="text-slate-500 text-sm">— {t('footer.tagline')}</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Sefay. {t('footer.rights')}
          </p>
        </div>
      </footer>

      {/* ── Modal ── */}
      {modal && (
        <AuthModal
          mode={modal}
          locale={locale}
          onClose={() => setModal(null)}
          onSwitch={() => setModal(modal === 'login' ? 'register' : 'login')}
        />
      )}
    </div>
  )
}