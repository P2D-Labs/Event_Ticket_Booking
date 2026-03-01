import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PanelLayout from '../layout/PanelLayout';
import { IconGrid, IconEvents, IconCategory, IconPromo, IconCoupon, IconPlan, IconBanner, IconTestimonial, IconSettings, IconUser } from '../icons/PanelIcons';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) return;
    if (user?.role !== 'SUPER_ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  if (user && user.role !== 'SUPER_ADMIN') {
    return null;
  }

  const navGroups = [
    {
      label: 'Admin',
      items: [
        { to: '/admin', label: 'Dashboard', icon: <IconGrid />, end: true },
        { to: '/admin/events', label: 'Events', icon: <IconEvents /> },
        { to: '/admin/users', label: 'User management', icon: <IconUser /> },
        { to: '/admin/categories', label: 'Categories', icon: <IconCategory /> },
        { to: '/admin/banners', label: 'Banners', icon: <IconBanner /> },
        { to: '/admin/testimonials', label: 'Testimonials', icon: <IconTestimonial /> },
        { to: '/admin/promotions', label: 'Promotions', icon: <IconPromo /> },
        { to: '/admin/coupons', label: 'Coupons', icon: <IconCoupon /> },
        { to: '/admin/plans', label: 'Premium plans', icon: <IconPlan /> },
        { to: '/admin/settings', label: 'Settings', icon: <IconSettings /> },
      ],
    },
  ];

  return (
    <PanelLayout
      title="Admin Dashboard"
      subtitle="System overview and approvals"
      navGroups={navGroups}
      logoHref="/admin"
    />
  );
}
