'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import JobCardCard from '@/components/JobCardCard';
import { StatCardSkeleton, CardSkeleton, SkeletonBlock } from '@/components/Skeleton';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  HiOutlineWrenchScrewdriver,
  HiOutlineClock,
  HiOutlinePlayCircle,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineFire,
  HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!loading && (!user || user.role === 'Customer')) {
      router.push(user ? '/job-cards' : '/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!socket) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['job-cards', 'active'] });
    };
    socket.on('jobCard:created', invalidate);
    socket.on('jobCard:statusChanged', invalidate);
    socket.on('jobCard:assigned', invalidate);
    socket.on('appointment:created', invalidate);
    socket.on('appointment:statusChanged', invalidate);
    return () => {
      socket.off('jobCard:created', invalidate);
      socket.off('jobCard:statusChanged', invalidate);
      socket.off('jobCard:assigned', invalidate);
      socket.off('appointment:created', invalidate);
      socket.off('appointment:statusChanged', invalidate);
    };
  }, [socket, queryClient]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
    refetchInterval: connected ? false : 30000,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/job-cards/active');
      return data.jobCards;
    },
    enabled: !!user && user.role !== 'Customer',
    refetchInterval: connected ? false : 15000,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonBlock className="h-7 w-64 mb-2" />
          <SkeletonBlock className="h-4 w-48 mb-8" />
          <StatCardSkeleton count={6} />
        </main>
      </div>
    );
  }

  if (!user || user.role === 'Customer') return null;

  const sb = stats?.statusBreakdown || [];
  const statusCounts: Record<string, number> = {};
  sb.forEach((s: any) => { statusCounts[s.status] = s.count; });

  const statDefs = [
    { label: 'Active Jobs', count: stats?.activeJobs || 0, color: 'from-indigo-500 to-indigo-600', icon: HiOutlineWrenchScrewdriver },
    { label: 'Pending', count: statusCounts.PENDING || 0, color: 'from-amber-500 to-yellow-600', icon: HiOutlineClock },
    { label: 'In Progress', count: statusCounts.IN_PROGRESS || 0, color: 'from-blue-500 to-blue-600', icon: HiOutlinePlayCircle },
    { label: 'Customers', count: stats?.totalCustomers || 0, color: 'from-emerald-500 to-emerald-600', icon: HiOutlineUsers },
    { label: 'Vehicles', count: stats?.totalVehicles || 0, color: 'from-purple-500 to-purple-600', icon: HiOutlineTruck },
    { label: 'Revenue', count: `$${Math.round(stats?.revenue?.total || 0).toLocaleString()}`, color: 'from-green-500 to-green-600', icon: HiOutlineCurrencyDollar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <HiOutlineFire className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workshop Dashboard</h2>
            <p className="text-sm text-gray-500">Real-time overview of workshop activity</p>
          </div>
        </div>

        {statsLoading ? (
          <StatCardSkeleton count={6} />
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {statDefs.map(({ label, count, color, icon: Icon }) => (
            <div key={label} className="relative bg-white rounded-2xl border border-gray-200/80 p-4 hover:shadow-md transition-shadow overflow-hidden group">
              <div className={`absolute top-0 right-0 w-20 h-20 -mr-5 -mt-5 rounded-full bg-gradient-to-br ${color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${color.replace('from-', 'bg-').split(' ')[0]} bg-opacity-10`}>
                  <Icon className={`w-4 h-4 ${color.replace('from-', 'text-').replace('-500', '-600').split(' ')[0]}`} />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{count}</div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineWrenchScrewdriver className="w-5 h-5 text-indigo-500" />
              Active Bays ({activeData?.length || 0})
            </h3>
            {activeLoading ? (
              <CardSkeleton count={4} />
            ) : activeData?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <HiOutlineWrenchScrewdriver className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active job cards</p>
                <p className="text-gray-400 text-sm mt-1">All bays are clear.</p>
                <button
                  onClick={() => router.push('/job-cards')}
                  className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                >
                  Create a job card
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeData?.map((jobCard: any) => (
                  <JobCardCard key={jobCard.id} jobCard={jobCard} />
                ))}
              </div>
            )}
          </div>

          {statsLoading ? (
            <div className="animate-pulse space-y-3 bg-white rounded-xl border border-gray-200 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="h-4 w-5" />
                    <SkeletonBlock className="h-4 w-24" />
                  </div>
                  <SkeletonBlock className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-emerald-500" />
              Top Mechanics
            </h3>
            <div className="bg-white rounded-xl border border-gray-200/80 divide-y divide-gray-100">
              {stats?.topMechanics?.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">No data yet.</div>
              ) : (
                stats?.topMechanics?.map((m: any, i: number) => (
                  <div key={m.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-900">{m.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{m.jobs_completed} jobs</span>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {statsLoading ? (
            <div className="animate-pulse space-y-2 bg-white rounded-xl border border-gray-200 p-3 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-blue-500" />
              Recent Jobs
            </h3>
            <div className="bg-white rounded-xl border border-gray-200/80 divide-y divide-gray-100">
              {stats?.recentJobCards?.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">No recent jobs.</div>
              ) : (
                stats?.recentJobCards?.map((j: any) => (
                  <div
                    key={j.id}
                    onClick={() => router.push(`/job-cards/${j.id}`)}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {j.make} {j.model}
                      </span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        j.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        j.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{j.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {j.customer_name} &middot; {j.plate_number || '—'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}

