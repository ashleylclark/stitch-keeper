import type { SelectHTMLAttributes } from 'react';

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput(props: SelectInputProps) {
  return (
    <select
      {...props}
      className="w-full cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-rose-400"
    />
  );
}
