import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Help from './pages/Help';
import Policies from './pages/Policies';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import DashboardMyEvents from './pages/dashboard/DashboardMyEvents';
import DashboardBookings from './pages/dashboard/DashboardBookings';
import CreateEvent from './pages/dashboard/CreateEvent';
import DashboardEventView from './pages/dashboard/DashboardEventView';
import DashboardEventEdit from './pages/dashboard/DashboardEventEdit';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminPlans from './pages/admin/AdminPlans';
import AdminBanners from './pages/admin/AdminBanners';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminCreateEvent from './pages/admin/AdminCreateEvent';
import AdminEventView from './pages/admin/AdminEventView';
import AdminEventEdit from './pages/admin/AdminEventEdit';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserView from './pages/admin/AdminUserView';

function PremiumRedirect() {
  const loc = useLocation();
  const to = `/account/profile${loc.search || ''}#premium`;
  return <Navigate to={to} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:slugOrId" element={<EventDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="help" element={<Help />} />
        <Route path="policies" element={<Policies />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
        <Route path="account/profile" element={<Profile />} />
        <Route path="account/bookings" element={<MyBookings />} />
        <Route path="premium" element={<PremiumRedirect />} />
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="my-events" element={<DashboardMyEvents />} />
          <Route path="events/new" element={<CreateEvent />} />
          <Route path="events/:id" element={<DashboardEventView />} />
          <Route path="events/:id/edit" element={<DashboardEventEdit />} />
          <Route path="bookings" element={<DashboardBookings />} />
        </Route>
      </Route>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/new" element={<AdminCreateEvent />} />
        <Route path="events/:id" element={<AdminEventView />} />
        <Route path="events/:id/edit" element={<AdminEventEdit />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserView />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
