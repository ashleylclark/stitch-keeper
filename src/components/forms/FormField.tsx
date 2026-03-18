import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  children: ReactNode;
};

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      {children}
    </div>
  );
}
