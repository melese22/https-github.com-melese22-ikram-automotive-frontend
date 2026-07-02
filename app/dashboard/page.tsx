'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import JobCardCard from '@/components/JobCardCard';
import { StatCardSkeleton, CardSkeleton, SkeletonBlock } from '@/components/Skeleton';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role === 'Customer')) {
      router.push(user ? '/job-cards' : '/login');
    }
  }, [user, loading, router]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
    refetchInterval: 30000,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/job-cards/active');
      return data.jobCards;
    },
    enabled: !!user && user.role !== 'Customer',
    refetchInterval: 15000,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Workshop Dashboard</h2>
          <p className="text-gray-500 mt-1">Real-time overview of workshop activity</p>
        </div>

        {statsLoading ? (
          <StatCardSkeleton count={6} />
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Active Jobs" count={stats?.activeJobs || 0} color="indigo" />
          <StatCard label="Pending" count={statusCounts.PENDING || 0} color="yellow" />
          <StatCard label="In Progress" count={statusCounts.IN_PROGRESS || 0} color="blue" />
          <StatCard label="Customers" count={stats?.totalCustomers || 0} color="green" />
          <StatCard label="Vehicles" count={stats?.totalVehicles || 0} color="purple" />
          <StatCard label="Revenue" count={`$${Math.round(stats?.revenue?.total || 0).toLocaleString()}`} color="green" />
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Active Bays ({activeData?.length || 0})
            </h3>
            {activeLoading ? (
              <CardSkeleton count={4} />
            ) : activeData?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No active job cards. All bays are clear.</p>
                <button
                  onClick={() => router.push('/job-cards')}
                  className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Mechanics</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
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
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Recent Jobs</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
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

function StatCard({ label, count, color }: { label: string; count: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div className={`rounded-lg border p-4 text-center ${colorMap[color] || 'bg-gray-50 border-gray-200'}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}