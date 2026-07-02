'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useEffect } from 'react';

export default function SuperAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  const { data } = useQuery({
    queryKey: ['superadmin-overview'],
    queryFn: async () => {
      const { data } = await api.get('/workshops/overview');
      return data;
    },
    enabled: !!user && user.role === 'SuperAdmin',
  });

  if (loading) return null;
  if (!user || user.role !== 'SuperAdmin') return null;

  const { workshops, totals } = data || { workshops: [], totals: {} };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SuperAdmin</h1>
            <p className="text-gray-500 text-sm mt-1">Multi-workshop management overview</p>
          </div>
          <button
            onClick={() => router.push('/superadmin/workshops/new')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            + New Workshop
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{totals.workshops || 0}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Workshops</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{totals.users || 0}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Total Users</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{totals.activeJobs || 0}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Active Jobs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${Math.round(totals.totalRevenue || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Total Revenue</div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workshops ({workshops.length})</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workshops.map((w: any) => {
            const roleCounts = w.stats?.users || [];
            const totalUsers = roleCounts.reduce((s: number, r: any) => s + r.count, 0);
            return (
              <div
                key={w.id}
                onClick={() => router.push(`/superadmin/workshops/${w.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm cursor-pointer transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{w.name}</h3>
                  {w.is_active ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  {w.address && <p>{w.address}</p>}
                  {w.phone && <p>{w.phone}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-bold text-gray-900">{totalUsers}</div>
                    <div className="text-gray-500">Users</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-bold text-gray-900">{w.stats?.jobCards?.active || 0}</div>
                    <div className="text-gray-500">Active Jobs</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="font-bold text-green-600">${Math.round(w.stats?.revenue?.total_revenue || 0).toLocaleString()}</div>
                    <div className="text-gray-500">Revenue</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}