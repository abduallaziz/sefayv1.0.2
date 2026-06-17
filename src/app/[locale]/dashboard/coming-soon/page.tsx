import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F1FB] flex items-center justify-center mb-6">
        <Clock className="w-8 h-8 text-[#0C447C]" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">{t('title')}</h1>
      <p className="text-sm text-slate-400 max-w-xs">{t('subtitle')}</p>
    </div>
  );
}