import type { SelectHTMLAttributes } from 'react';

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput(props: SelectInputProps) {
  return (
    <select
      {...props}
      className="w-full cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500"
    />
  );
}
