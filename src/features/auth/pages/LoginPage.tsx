'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, type UserRole, type BusinessType } from '@/core/auth/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';

export function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const loginSchema = z.object({
    email: z.string().email(t('auth.emailInvalid')),
    password: z.string().min(6, t('auth.passwordShort')),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await authApi.login({ ...data, device_name: 'Web Browser' });
      setAuth(
        {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role as UserRole,
          tenantId: res.user.tenant_id,
          sessionId: res.user.session_id,
          permissions: res.user.permissions ?? [],
          features: res.user.features ?? [],
          business_type: (res.user.business_type as BusinessType) ?? null,
        },
        res.access_token,
      );
      router.replace(res.user.role === 'superadmin' ? `/${locale}/superadmin` : `/${locale}/dashboard`);
    } catch {
      setError(t('auth.invalidCredentials'));
    }
  };

  const toggleLang = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    router.push(pathname.replace(`/${locale}`, `/${next}`));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#F5F8FC' }}
    >
      {/* Grid bg */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(#E4EAF2 1px,transparent 1px),linear-gradient(90deg,#E4EAF2 1px,transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,#000,transparent)',
        opacity: .5,
      }} />

      {/* Lang switcher */}
      <button
        onClick={toggleLang}
        className="absolute top-5 end-5 flex items-center gap-[6px] px-3 py-2 rounded-[9px] text-[13px] font-semibold border transition-all z-10"
        style={{ color: '#0C447C', background: '#fff', borderColor: '#E4EAF2', boxShadow: '0 1px 3px rgba(10,22,40,.06)' }}
      >
        {locale === 'ar' ? 'EN' : 'عربي'}
      </button>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-[10px] mb-8">
          <div className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0C447C,#2671C4)', boxShadow: '0 6px 18px rgba(12,68,124,.3)' }}>
            <svg viewBox="0 0 24 24" style={{ width: 23, height: 23, fill: '#fff', stroke: 'none' }}><path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" /></svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#0C447C', letterSpacing: '-.5px' }}>Sefay</span>
        </div>

        {/* Card */}
        <div className="rounded-[24px] p-8" style={{ background: '#fff', boxShadow: '0 8px 16px rgba(10,22,40,.05),0 20px 48px rgba(10,22,40,.1)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>
            {t('auth.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#8C9CB2', marginBottom: 28 }}>
            {t('auth.subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#54657C', marginBottom: 7 }}>
                {t('auth.email')}
              </label>
              <input
                {...register('email')}
                type="email"
                dir="ltr"
                placeholder={t('auth.emailPlaceholder')}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #E4EAF2', fontSize: 14, background: '#F5F8FC', color: '#0A1628', outline: 'none', fontFamily: 'inherit', transition: 'all .18s' }}
                onFocus={e => { e.target.style.borderColor = '#0C447C'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3.5px rgba(12,68,124,.11)' }}
                onBlur={e => { e.target.style.borderColor = '#E4EAF2'; e.target.style.background = '#F5F8FC'; e.target.style.boxShadow = 'none' }}
              />
              {errors.email && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#54657C', marginBottom: 7 }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', paddingInlineEnd: 42, borderRadius: 11, border: '1.5px solid #E4EAF2', fontSize: 14, background: '#F5F8FC', color: '#0A1628', outline: 'none', fontFamily: 'inherit', transition: 'all .18s' }}
                  onFocus={e => { e.target.style.borderColor = '#0C447C'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3.5px rgba(12,68,124,.11)' }}
                  onBlur={e => { e.target.style.borderColor = '#E4EAF2'; e.target.style.background = '#F5F8FC'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#8C9CB2', border: 'none', background: 'none', cursor: 'pointer', right: 12 }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', color: '#EF4444', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-50"
              style={{ padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0C447C,#1565C0)', border: 'none', cursor: 'pointer', boxShadow: '0 6px 18px rgba(12,68,124,.3)', fontFamily: 'inherit' }}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('auth.submit')}
            </button>
          </form>
        </div>

        {/* Back to landing */}
        <p className="text-center mt-5" style={{ fontSize: 13, color: '#8C9CB2' }}>
          <button
            onClick={() => router.push(`/${locale}`)}
            style={{ color: '#0C447C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            ← {locale === 'ar' ? 'العودة للرئيسية' : 'Back to home'}
          </button>
        </p>
      </div>
    </div>
  );
}