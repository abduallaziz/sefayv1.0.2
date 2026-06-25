'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import {
  LayoutDashboard, Building2, CreditCard,
  ToggleLeft, Shield, BarChart3, LogOut, Settings, X,
} from 'lucide-react';

interface SuperAdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

// Always dark — SuperAdmin page content assumes a permanent dark background,
// so the sidebar doesn't follow the tenant-dashboard light/dark toggle.
const isDark = true;

export function SuperAdminSidebar({ open, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const textMuted = isDark ? '#8B949E' : '#54657C';
  const iconMuted = isDark ? '#6E7681' : '#8C9CB2';
  const hoverBg = isDark ? 'rgba(91,155,213,0.12)' : 'rgba(12,68,124,0.065)';
  const hoverText = isDark ? '#5B9BD5' : '#0C447C';
  const sectionLabel = isDark ? '#6E7681' : '#94A3B8';

  const NAV = [
    {
      title: locale === 'ar' ? 'عام' : 'General',
      items: [
        { key: 'overview', href: '/superadmin', label: t('overview'), icon: LayoutDashboard },
      ],
    },
    {
      title: locale === 'ar' ? 'الإدارة' : 'Management',
      items: [
        { key: 'tenants',       href: '/superadmin/tenants',       label: t('tenants'),       icon: Building2  },
        { key: 'subscriptions', href: '/superadmin/subscriptions', label: t('subscriptions'), icon: CreditCard  },
        { key: 'feature-flags', href: '/superadmin/feature-flags', label: t('featureFlags'),  icon: ToggleLeft  },
        { key: 'auth-control',  href: '/superadmin/auth-control',  label: t('authControl'),   icon: Shield      },
        { key: 'settings',      href: '/superadmin/settings',      label: t('settings'),      icon: Settings    },
      ],
    },
    {
      title: locale === 'ar' ? 'التقارير' : 'Reports',
      items: [
        { key: 'reports', href: '/superadmin/reports', label: t('reports'), icon: BarChart3 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 start-0 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
        )}
        style={{
          top: '66px',
          width: '264px',
          background: isDark
            ? 'linear-gradient(180deg, rgba(22,27,34,0.94), rgba(13,17,23,0.88))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.72))',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          borderInlineEnd: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.95)',
          boxShadow: locale === 'ar' ? '-4px 0 28px rgba(10,22,40,0.06)' : '4px 0 28px rgba(10,22,40,0.06)',
        }}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)' }}>
          <span className="text-sm font-semibold" style={{ color: textMuted }}>{locale === 'ar' ? 'القائمة' : 'Menu'}</span>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textMuted, cursor: 'pointer', background: 'transparent', border: 'none',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Brand */}
        <div style={{ padding: '17px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,22,40,0.06)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>S</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.3, color: isDark ? '#E6EDF3' : '#0A1628' }}>Sefay</p>
              <p style={{ fontSize: '11px', color: '#8B5CF6' }}>Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '13px 13px 3px' }}>
          {NAV.map((section) => (
            <div key={section.title} style={{ marginBottom: '18px' }}>
              <p style={{
                padding: '0 12px', marginBottom: '6px', fontSize: '11px', fontWeight: 600,
                color: sectionLabel, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={fullHref}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 12px', borderRadius: '13px',
                      fontSize: '13px', fontWeight: isActive ? 600 : 500,
                      marginBottom: '2px', textDecoration: 'none',
                      transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                      ...(isActive
                        ? {
                            background: isDark
                              ? 'linear-gradient(135deg, #161D29, #1C2433)'
                              : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            color: isDark ? '#A78BFA' : '#fff',
                            border: isDark ? '1px solid rgba(167,139,250,0.28)' : 'none',
                            boxShadow: isDark
                              ? '0 4px 14px rgba(0,0,0,0.45)'
                              : '0 6px 18px rgba(124,58,237,0.3)',
                          }
                        : {
                            color: textMuted,
                            background: 'transparent',
                          }),
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = hoverBg
                        e.currentTarget.style.color = hoverText
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = textMuted
                      }
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2}
                      style={{ color: isActive ? (isDark ? '#A78BFA' : '#fff') : iconMuted, flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Account footer */}
        <div style={{ padding: '13px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px', borderRadius: '14px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(10,22,40,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(10,22,40,0.05)',
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #8B5CF6, #5B21B6)',
              border: isDark ? '2px solid rgba(255,255,255,0.1)' : '2px solid rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#E6EDF3' : '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '10px', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={clearAuth}
              style={{ color: textMuted, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textMuted }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
