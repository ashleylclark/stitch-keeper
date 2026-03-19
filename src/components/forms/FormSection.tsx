import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/80">
      <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
        {title}
      </h2>
      {children}
    </section>
  );
}
