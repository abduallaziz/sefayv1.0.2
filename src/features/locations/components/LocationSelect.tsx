'use client';

import { useTranslations } from 'next-intl';
import { useLocations } from '../hooks/useLocations';

interface Props {
  warehouseId: string | null;
  value: string;
  onChange: (locationId: string) => void;
  className?: string;
  disabled?: boolean;
}

export function LocationSelect({ warehouseId, value, onChange, className, disabled }: Props) {
  const t = useTranslations('locations');
  const { data } = useLocations(warehouseId, { limit: 100, isActive: true });
  const locations = data?.data ?? [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled || !warehouseId}
    >
      <option value="">{t('selectLocationOptional')}</option>
      {locations.map((loc) => (
        <option key={loc.id} value={loc.id}>
          {loc.code} — {loc.name}
        </option>
      ))}
    </select>
  );
}
