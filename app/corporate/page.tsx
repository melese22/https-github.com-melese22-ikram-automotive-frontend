'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { StatCardSkeleton, SkeletonBlock } from '@/components/Skeleton';
import {
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineWrenchScrewdriver,
  HiOutlineCurrencyDollar,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';

export default function CorporateDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CorporateAdmin')) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['company-me'],
    queryFn: async () => { const { data } = await api.get('/company/me'); return data; },
    enabled: !!user && user.role === 'CorporateAdmin',
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['company-reports'],
    queryFn: async () => { const { data } = await api.get('/company/reports'); return data; },
    enabled: !!user && user.role === 'CorporateAdmin',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonBlock className="h-7 w-64 mb-8" />
          <StatCardSkeleton count={4} />
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'CorporateAdmin') return null;

  const workshops = companyData?.workshops || [];
  const reports = reportsData?.reports || {};
  const totalRevenue = (reports.revenue || []).reduce((s: number, r: any) => s + parseFloat(r.revenue || 0), 0);
  const totalJobs = (reports.jobs || []).reduce((s: number, j: any) => s + parseInt(j.total_jobs || 0), 0);
  const totalUsers = workshops.reduce((s: number, w: any) => s + parseInt(w.user_count || 0), 0);

  const statDefs = [
    { label: 'Branches', value: workshops.length, color: 'from-blue-500 to-blue-600', icon: HiOutlineBuildingOffice2 },
    { label: 'Total Users', value: totalUsers, color: 'from-purple-500 to-purple-600', icon: HiOutlineUsers },
    { label: 'Total Jobs', value: totalJobs, color: 'from-amber-500 to-orange-600', icon: HiOutlineWrenchScrewdriver },
    { label: 'Revenue', value: `$${Math.round(totalRevenue).toLocaleString()}`, color: 'from-emerald-500 to-emerald-600', icon: HiOutlineCurrencyDollar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyData?.company?.name || 'Corporate Dashboard'}</h1>
            <p className="text-sm text-gray-500">Multi-branch overview</p>
          </div>
        </div>

        {companyLoading ? (
          <StatCardSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statDefs.map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="relative bg-white rounded-2xl border border-gray-200/80 p-5 overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 -mr-5 -mt-5 rounded-full bg-gradient-to-br ${color} opacity-[0.07]`} />
                <Icon className={`w-5 h-5 ${color.replace('from-', 'text-').replace('-500', '-600').split(' ')[0]} mb-2`} />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Branch performance */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineChartBarSquare className="w-5 h-5 text-indigo-500" />
              Branch Revenue
            </h3>
            {reportsLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3].map(i => <SkeletonBlock key={i} className="h-8 w-full" />)}
              </div>
            ) : (reports.revenue || []).length === 0 ? (
              <p className="text-sm text-gray-400">No revenue data yet.</p>
            ) : (
              <div className="space-y-3">
                {(reports.revenue || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 truncate">{r.name}</span>
                    <span className="text-sm font-semibold text-emerald-600">${Math.round(parseFloat(r.revenue)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Branch list */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-blue-500" />
              Branches ({workshops.length})
            </h3>
            {workshops.length === 0 ? (
              <p className="text-sm text-gray-400">No branches linked yet.</p>
            ) : (
              <div className="space-y-3">
                {workshops.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.user_count} users · {w.active_jobs} active</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${w.is_active ? 'bg-emerald-400' : 'bg-red-300'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
