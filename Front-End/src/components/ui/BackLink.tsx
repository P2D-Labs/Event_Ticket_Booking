import { Link } from 'react-router-dom';
import { IconChevronLeft } from '../icons/PanelIcons';

type Props = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

export default function BackLink({ to, children, className = '' }: Props) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline ${className}`}
    >
      <IconChevronLeft /> {children}
    </Link>
  );
}
