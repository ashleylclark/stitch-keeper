import type { TextareaHTMLAttributes } from 'react';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea(props: TextAreaProps) {
  return (
    <textarea
      {...props}
      className="min-h-24 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500"
    />
  );
}
