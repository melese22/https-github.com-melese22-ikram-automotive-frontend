'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineHome,
  HiOutlineTruck,
  HiOutlineWrenchScrewdriver,
  HiOutlinePhoto,
  HiOutlineCube,
  HiOutlineBell,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Job Cards', href: '/job-cards', icon: <HiOutlineWrenchScrewdriver className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Before/After', href: '/before-after', icon: <HiOutlinePhoto className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Inventory', href: '/inventory', icon: <HiOutlineCube className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Notifications', href: '/notifications', icon: <HiOutlineBell className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Invoices', href: '/invoices', icon: <HiOutlineDocumentText className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Appointments', href: '/appointments', icon: <HiOutlineCalendarDays className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Reports', href: '/reports', icon: <HiOutlineChartBarSquare className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager', 'Mechanic'] },
  { label: 'Team', href: '/dashboard/team', icon: <HiOutlineUserGroup className="w-5 h-5" />, roles: ['SuperAdmin', 'WorkshopManager'] },
  { label: 'Corporate', href: '/corporate', icon: <HiOutlineBuildingOffice2 className="w-5 h-5" />, roles: ['CorporateAdmin'] },
  { label: 'SuperAdmin', href: '/superadmin', icon: <HiOutlineShieldCheck className="w-5 h-5" />, roles: ['SuperAdmin'] },
];

const customerItems: NavItem[] = [
  { label: 'My Portal', href: '/portal', icon: <HiOutlineHome className="w-5 h-5" />, roles: ['Customer'] },
  { label: 'Book Appointment', href: '/portal/book', icon: <HiOutlineCalendarDays className="w-5 h-5" />, roles: ['Customer'] },
  { label: 'My Vehicles', href: '/portal/vehicles', icon: <HiOutlineTruck className="w-5 h-5" />, roles: ['Customer'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const items = user.role === 'Customer' ? customerItems : navItems;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h1
          className="text-lg font-bold text-gray-900 cursor-pointer truncate"
          onClick={() => router.push('/')}
        >
          Ikram Automotive
        </h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <HiOutlineXMark className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <HiOutlineUser className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar (offscreen) */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        {sidebarContent}
      </aside>
    </>
  );
}
