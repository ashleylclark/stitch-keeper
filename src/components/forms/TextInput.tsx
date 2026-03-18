import type { InputHTMLAttributes } from 'react';

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput(props: TextInputProps) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-rose-400"
    />
  );
}
