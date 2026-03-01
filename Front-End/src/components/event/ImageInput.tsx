import { useState, useRef, useEffect } from 'react';
import FullScreenImage from '../ui/FullScreenImage';

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
  /** When user selects a file (drag/drop or pick), we only show preview. Call this so parent can store the file and upload on proceed/save. */
  onPendingFileChange?: (file: File | null) => void;
};

export default function ImageInput({ value, onChange, label, required = false, placeholder = 'https://...', onPendingFileChange }: Props) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [dragOver, setDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) return;
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const clearPending = () => {
    setPendingFile(null);
    setPendingPreviewUrl(null);
    onPendingFileChange?.(null);
  };

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFile(file);
    onPendingFileChange?.(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <label className="block text-xs text-[var(--color-text-muted)]">{label}{required ? ' *' : ''}</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`text-xs px-2 py-1 rounded ${mode === 'url' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'}`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`text-xs px-2 py-1 rounded ${mode === 'upload' ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'}`}
          >
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          value={value}
          onChange={(e) => {
            clearPending();
            onChange(e.target.value);
          }}
          required={required}
          placeholder={placeholder}
          className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded text-sm"
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
          {pendingPreviewUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img src={pendingPreviewUrl} alt="Preview" className="max-h-40 rounded border border-[var(--color-border)] object-contain" />
              <p className="text-xs text-[var(--color-text-muted)]">Image selected — will upload when you save</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">Drag and drop an image here, or click to select</p>
              {value && <p className="text-xs text-[var(--color-primary)] mt-2 truncate max-w-full">{value}</p>}
            </>
          )}
        </div>
      )}

      {(value || pendingPreviewUrl) && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => (value || pendingPreviewUrl) && setPreviewOpen(true)}
            className="shrink-0 w-20 h-20 rounded overflow-hidden border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <img src={pendingPreviewUrl || value} alt="" className="w-full h-full object-cover" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Preview</p>
            {(value || pendingPreviewUrl) && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="text-sm text-[var(--color-primary)] hover:underline truncate block max-w-full"
              >
                View full size
              </button>
            )}
            <button
              type="button"
              onClick={() => { onChange(''); clearPending(); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-1"
            >
              Remove image
            </button>
          </div>
          {(value || pendingPreviewUrl) && (
            <FullScreenImage open={previewOpen} src={pendingPreviewUrl || value} alt={label} onClose={() => setPreviewOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}
