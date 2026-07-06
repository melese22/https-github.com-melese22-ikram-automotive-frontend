'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useEffect } from 'react';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineWrenchScrewdriver,
  HiOutlineCurrencyDollar,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';

const statCards = [
  {
    key: 'workshops',
    label: 'Workshops',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-50',
    icon: HiOutlineBuildingOffice2,
    format: (v: number) => v.toString(),
  },
  {
    key: 'users',
    label: 'Total Users',
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-500',
    bgLight: 'bg-purple-50',
    icon: HiOutlineUsers,
    format: (v: number) => v.toString(),
  },
  {
    key: 'activeJobs',
    label: 'Active Jobs',
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-500',
    bgLight: 'bg-amber-50',
    icon: HiOutlineWrenchScrewdriver,
    format: (v: number) => v.toString(),
  },
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    color: 'from-emerald-500 to-emerald-600',
    textColor: 'text-emerald-500',
    bgLight: 'bg-emerald-50',
    icon: HiOutlineCurrencyDollar,
    format: (v: number) => `$${Math.round(v).toLocaleString()}`,
  },
];

export default function SuperAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-overview'],
    queryFn: async () => {
      const { data } = await api.get('/workshops/overview');
      return data;
    },
    enabled: !!user && user.role === 'SuperAdmin',
  });

  if (loading) return null;
  if (!user || user.role !== 'SuperAdmin') return null;

  const { workshops, totals } = data || { workshops: [], totals: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                <HiOutlineShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SuperAdmin</h1>
                <p className="text-sm text-gray-500">Multi-workshop management overview</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/superadmin/workshops/new')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 shadow-sm hover:shadow-md transition-all"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            New Workshop
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ key, label, color, icon: Icon, format }) => {
            const value = (totals as any)[key] || 0;
            return (
              <div
                key={key}
                className="relative bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${color.replace('from-', 'bg-').split(' ')[0].replace('to-', '')} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${color.replace('from-', 'text-').split(' ')[0].replace('-500', '-600')}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{format(value)}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Workshop Grid Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Workshops
            <span className="ml-2 text-sm font-normal text-gray-400">({workshops.length})</span>
          </h2>
        </div>

        {/* Workshop Cards */}
        {workshops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineBuildingOffice2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No workshops yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first workshop to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workshops.map((w: any) => {
              const roleCounts = w.stats?.users || [];
              const totalUsers = roleCounts.reduce((s: number, r: any) => s + r.count, 0);
              return (
                <div
                  key={w.id}
                  onClick={() => router.push(`/superadmin/workshops/${w.id}`)}
                  className="group bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-lg hover:border-primary-200/80 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${w.is_active ? 'bg-emerald-400 shadow-sm shadow-emerald-200' : 'bg-red-300'}`} />
                      <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
                    </div>
                    <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mb-4 pl-5">
                    {w.address && <p className="truncate">{w.address}</p>}
                    {w.phone && <p className="font-mono">{w.phone}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Users', value: totalUsers, color: 'text-gray-900' },
                      { label: 'Active Jobs', value: w.stats?.jobCards?.active || 0, color: 'text-gray-900' },
                      { label: 'Revenue', value: `$${Math.round(w.stats?.revenue?.total_revenue || 0).toLocaleString()}`, color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50/80 rounded-xl p-2.5 text-center group-hover:bg-gray-50 transition-colors">
                        <div className={`text-sm font-bold ${color}`}>{value}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}