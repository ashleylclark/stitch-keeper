import { useId, useState } from 'react';
import { Image, Upload, X } from 'lucide-react';
import { uploadMedia } from '../../shared/api/media';

type ImageReferenceInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ImageReferenceInput({
  value,
  onChange,
  placeholder = 'https:// or upload an image',
}: ImageReferenceInputProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const upload = await uploadMedia(file);
      onChange(upload.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload image.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-accent-400"
        />
        <input
          id={inputId}
          type="file"
          accept="image/gif,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            void handleFileChange(event);
          }}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          title="Upload image"
          className={[
            'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-600 transition hover:border-accent-300 hover:text-accent-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:border-accent-500 dark:hover:text-accent-300',
            isUploading ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
        >
          <Upload size={16} />
        </label>
        {value ? (
          <button
            type="button"
            title="Remove image"
            onClick={() => {
              onChange('');
              setError(null);
            }}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-stone-950 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {isUploading ? (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Uploading image...
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}
      {value ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
          <img
            src={value}
            alt=""
            className="max-h-52 w-full object-contain"
            onError={() => setError('Image preview could not be loaded.')}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-stone-400 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-500">
          <Image size={18} />
        </div>
      )}
    </div>
  );
}
