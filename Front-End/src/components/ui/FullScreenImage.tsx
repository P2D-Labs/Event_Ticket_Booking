import { useEffect } from 'react';
import { IconClose } from '../icons/PanelIcons';

type Props = {
  open: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
};

export default function FullScreenImage({ open, src, alt = '', onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close"
      >
        <span className="inline-block w-5 h-5 [&>svg]:w-full [&>svg]:h-full"><IconClose /></span>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
