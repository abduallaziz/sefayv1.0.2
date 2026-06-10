'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, type UserRole } from '@/core/auth/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await authApi.login({
        ...data,
        device_name: 'Web Browser',
      });
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
        },
        res.access_token,
        res.refresh_token,
      );
      if (res.user.role === 'superadmin') {
        router.replace(`/${locale}/superadmin`);
      } else {
        router.replace(`/${locale}/dashboard`);
      }
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c12] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-white text-xl font-semibold">Sefay</span>
        </div>

        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl p-6">
          <h1 className="text-white text-lg font-semibold mb-1">تسجيل الدخول</h1>
          <p className="text-slate-500 text-sm mb-6">أدخل بياناتك للمتابعة</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">البريد الإلكتروني</label>
              <input
                {...register('email')}
                type="email"
                dir="ltr"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                placeholder="example@company.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">كلمة المرور</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 pe-10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              دخول
            </button>
          </form>
          <p className="text-slate-600 text-xs text-center mt-4">للتجربة: owner@test.com / 123456</p>
        </div>
      </div>
    </div>
  );
}