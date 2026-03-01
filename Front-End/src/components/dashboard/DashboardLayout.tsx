import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PanelLayout from '../layout/PanelLayout';
import { IconGrid, IconEvents, IconTicket } from '../icons/PanelIcons';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (user === null) return;
    if (!isOrganizer) {
      navigate('/');
    }
  }, [user, isOrganizer, navigate]);

  if (user && !isOrganizer) {
    return null;
  }

  const navGroups = [
    {
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: <IconGrid />, end: true },
        { to: '/dashboard/my-events', label: 'My Events', icon: <IconEvents /> },
        { to: '/dashboard/bookings', label: 'Bookings', icon: <IconTicket /> },
      ],
    },
  ];

  return (
    <PanelLayout
      title="Organizer Dashboard"
      subtitle="Manage your events and bookings"
      navGroups={navGroups}
      logoHref="/dashboard"
      showSidebarFooter={false}
      boxed
      sidebarTransparent
    />
  );
}
