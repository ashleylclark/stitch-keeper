import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      {children}
    </section>
  );
}
