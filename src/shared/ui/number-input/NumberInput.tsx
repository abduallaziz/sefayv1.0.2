'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'lang' | 'dir'> {
  value: string;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}

/**
 * Plain-text numeric input — not <input type="number">.
 * Native number inputs render spinner arrows and, under an Arabic document
 * language, switch to Arabic-Indic digits (٠١٢٣). This forces Western
 * digits via lang="en", has no spinners, and lets the field be empty
 * without React forcing it to 0/NaN.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimal = true, allowNegative = false, className, ...props }, ref) => {
    const pattern = allowNegative
      ? (allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/)
      : (allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/);

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        lang="en"
        dir="ltr"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || pattern.test(v)) onChange(v);
        }}
        className={className}
      />
    );
  },
);
NumberInput.displayName = 'NumberInput';
