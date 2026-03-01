import { useState } from 'react';
import FullScreenImage from './FullScreenImage';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function ClickableImage({ src, alt = '', className = '', children }: Props) {
  const [open, setOpen] = useState(false);

  if (!src) return children ?? null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`block cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded overflow-hidden ${className}`}
        aria-label="View full size"
      >
        {children ?? <img src={src} alt={alt} className="w-full h-full object-cover" />}
      </button>
      <FullScreenImage open={open} src={src} alt={alt} onClose={() => setOpen(false)} />
    </>
  );
}
