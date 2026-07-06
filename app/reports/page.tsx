'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { SkeletonBlock, StatCardSkeleton, TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useState } from 'react';
import {
  HiOutlineChartBarSquare,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineWrenchScrewdriver,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineChartPie,
} from 'react-icons/hi2';

export default function ReportsPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [revenueStart, setRevenueStart] = useState(thirtyDaysAgo);
  const [revenueEnd, setRevenueEnd] = useState(today);
  const [revenueGroup, setRevenueGroup] = useState('day');
  const [mechanicStart, setMechanicStart] = useState('');
  const [mechanicEnd, setMechanicEnd] = useState('');

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['reports', 'revenue', revenueStart, revenueEnd, revenueGroup],
    queryFn: async () => {
      const { data } = await api.get(`/reports/revenue?startDate=${revenueStart}&endDate=${revenueEnd}&groupBy=${revenueGroup}`);
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: mechanics, isLoading: mechLoading } = useQuery({
    queryKey: ['reports', 'mechanics', mechanicStart, mechanicEnd],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (mechanicStart) params.set('startDate', mechanicStart);
      if (mechanicEnd) params.set('endDate', mechanicEnd);
      const { data } = await api.get(`/reports/mechanics?${params.toString()}`);
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: services, isLoading: svcLoading } = useQuery({
    queryKey: ['reports', 'services'],
    queryFn: async () => {
      const { data } = await api.get('/reports/services');
      return data.services;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: parts, isLoading: partsLoading } = useQuery({
    queryKey: ['reports', 'parts'],
    queryFn: async () => {
      const { data } = await api.get('/reports/parts');
      return data.parts;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: apptStats, isLoading: apptLoading } = useQuery({
    queryKey: ['reports', 'appointments'],
    queryFn: async () => {
      const { data } = await api.get('/reports/appointments');
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  if (!user || user.role === 'Customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="w-full lg:ml-64 px-4 py-8 text-center text-gray-500">Not available for customers.</div>
      </div>
    );
  }

  const totalRevenue = revenue?.report?.reduce((s: number, r: any) => s + r.revenue, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <HiOutlineChartBarSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Data insights and business performance</p>
          </div>
        </div>

        {/* Summary Cards */}
        {revLoading && apptLoading && mechLoading ? (
          <StatCardSkeleton count={4} />
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'from-green-500 to-emerald-600', icon: HiOutlineCurrencyDollar },
            { label: 'Total Appointments', value: apptStats?.totalAppointments || 0, color: 'from-blue-500 to-blue-600', icon: HiOutlineCalendarDays },
            { label: "Today's Appointments", value: apptStats?.todayAppointments || 0, color: 'from-purple-500 to-purple-600', icon: HiOutlineCalendarDays },
            { label: 'Active Mechanics', value: mechanics?.mechanics?.length || 0, color: 'from-gray-500 to-gray-600', icon: HiOutlineUsers },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="relative bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-shadow overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${color.replace('from-', 'bg-').split(' ')[0]} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${color.replace('from-', 'text-').split(' ')[0].replace('-500', '-600')}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
        )}

        {/* Revenue Report */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineCurrencyDollar className="w-5 h-5 text-green-500" />
              Revenue Report
            </h2>
            <div className="flex items-center gap-2">
              <input type="date" value={revenueStart} onChange={(e) => setRevenueStart(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={revenueEnd} onChange={(e) => setRevenueEnd(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              <select value={revenueGroup} onChange={(e) => setRevenueGroup(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
          {revLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : revenue?.report?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No paid invoices in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Period</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Invoices</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenue?.report?.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 text-gray-900">{new Date(r.period).toLocaleDateString()}</td>
                      <td className="py-2 text-right text-gray-600">{r.invoice_count}</td>
                      <td className="py-2 text-right font-semibold">${parseFloat(r.revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mechanic Productivity */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HiOutlineWrenchScrewdriver className="w-5 h-5 text-orange-500" />
                Mechanic Productivity
              </h2>
              <div className="flex gap-1">
                <input type="date" value={mechanicStart} onChange={(e) => setMechanicStart(e.target.value)}
                  className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
                <input type="date" value={mechanicEnd} onChange={(e) => setMechanicEnd(e.target.value)}
                  className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              </div>
            </div>
            {mechLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : mechanics?.mechanics?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 text-gray-500 font-medium">Mechanic</th>
                      <th className="text-right py-2.5 text-gray-500 font-medium">Jobs</th>
                      <th className="text-right py-2.5 text-gray-500 font-medium">Avg Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mechanics?.mechanics?.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 text-gray-900">{m.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{m.jobs_completed}</td>
                        <td className="py-2.5 text-right font-medium">{Math.round(m.avg_hours * 10) / 10}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Common Services */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineChartPie className="w-5 h-5 text-violet-500" />
              Common Services
            </h2>
            {svcLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-4 w-8" />
                    </div>
                    <SkeletonBlock className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            ) : services?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No job card descriptions yet.</p>
            ) : (
              <div className="space-y-3">
                {services?.slice(0, 10).map((s: any, i: number) => {
                  const max = Math.max(...services.map((x: any) => x.count));
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-900 truncate">{s.service}</span>
                        <span className="text-gray-500 font-medium">{s.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Parts Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineCube className="w-5 h-5 text-amber-500" />
              Parts Usage (Top 20)
            </h2>
            {partsLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : parts?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No parts used yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 text-gray-500 font-medium">Part</th>
                      <th className="text-right py-2.5 text-gray-500 font-medium">Qty Used</th>
                      <th className="text-right py-2.5 text-gray-500 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parts?.map((p: any) => (
                      <tr key={p.part_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 text-gray-900">{p.part_name}</td>
                        <td className="py-2.5 text-right text-gray-600">{p.total_used}</td>
                        <td className="py-2.5 text-right font-medium">${parseFloat(p.total_cost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Appointment Status */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineCalendarDays className="w-5 h-5 text-purple-500" />
              Appointment Status
            </h2>
            {apptLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="h-4 w-16" />
                    </div>
                    <SkeletonBlock className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : apptStats?.statusBreakdown?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No appointments.</p>
            ) : (
              <div className="space-y-3">
                {apptStats?.statusBreakdown?.map((s: any) => {
                  const total = apptStats.totalAppointments;
                  const pct = total ? Math.round((s.count / total) * 100) : 0;
                  const colorMap: Record<string, string> = {
                    scheduled: 'bg-yellow-400',
                    confirmed: 'bg-blue-400',
                    in_progress: 'bg-purple-400',
                    completed: 'bg-green-400',
                    cancelled: 'bg-red-400',
                    no_show: 'bg-gray-400',
                  };
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 capitalize">{s.status.replace('_', ' ')}</span>
                        <span className="text-gray-500 font-medium">{s.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`${colorMap[s.status] || 'bg-gray-400'} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}