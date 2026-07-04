'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => router.push('/')}
            >
              Ikram Automotive
            </h1>
            <div className="hidden sm:flex gap-4">
              {user.role === 'Customer' ? (
                <>
                  <button
                    onClick={() => router.push('/portal')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    My Portal
                  </button>
                  <button
                    onClick={() => router.push('/portal/book')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Book Appointment
                  </button>
                  <button
                    onClick={() => router.push('/portal/vehicles')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    My Vehicles
                  </button>
                </>
              ) : (
                <>
                  {user.role === 'SuperAdmin' && (
                    <button
                      onClick={() => router.push('/superadmin')}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      SuperAdmin
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/vehicles')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Vehicles
                  </button>
                  <button
                    onClick={() => router.push('/job-cards')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Job Cards
                  </button>
                  <button
                    onClick={() => router.push('/before-after')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Before/After
                  </button>
                  <button
                    onClick={() => router.push('/inventory')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => router.push('/notifications')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => router.push('/invoices')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Invoices
                  </button>
                  <button
                    onClick={() => router.push('/appointments')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Appointments
                  </button>
                  <button
                    onClick={() => router.push('/reports')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Reports
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.name}
              <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                {user.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
