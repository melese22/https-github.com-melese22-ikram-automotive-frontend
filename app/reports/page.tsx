'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { SkeletonBlock, StatCardSkeleton, TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useState } from 'react';

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
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Not available for customers.</div>
      </div>
    );
  }

  const totalRevenue = revenue?.report?.reduce((s: number, r: any) => s + r.revenue, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Reports & Analytics</h1>

        {/* Summary Cards */}
        {revLoading && apptLoading && mechLoading ? (
          <StatCardSkeleton count={4} />
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Revenue</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{apptStats?.totalAppointments || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Appointments</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{apptStats?.todayAppointments || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Today&apos;s Appointments</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{mechanics?.mechanics?.length || 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Active Mechanics</div>
          </div>
        </div>
        )}

        {/* Revenue Report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Report</h2>
            <div className="flex items-center gap-2">
              <input type="date" value={revenueStart} onChange={(e) => setRevenueStart(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={revenueEnd} onChange={(e) => setRevenueEnd(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500" />
              <select value={revenueGroup} onChange={(e) => setRevenueGroup(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mechanic Productivity</h2>
              <div className="flex gap-1">
                <input type="date" value={mechanicStart} onChange={(e) => setMechanicStart(e.target.value)}
                  className="w-28 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500" placeholder="Start" />
                <input type="date" value={mechanicEnd} onChange={(e) => setMechanicEnd(e.target.value)}
                  className="w-28 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500" placeholder="End" />
              </div>
            </div>
            {mechLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : mechanics?.mechanics?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Mechanic</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Jobs</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Avg Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mechanics?.mechanics?.map((m: any) => (
                    <tr key={m.id}>
                      <td className="py-2 text-gray-900">{m.name}</td>
                      <td className="py-2 text-right text-gray-600">{m.jobs_completed}</td>
                      <td className="py-2 text-right text-gray-600">{Math.round(m.avg_hours * 10) / 10}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Common Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Services</h2>
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
              <div className="space-y-2">
                {services?.slice(0, 10).map((s: any, i: number) => {
                  const max = Math.max(...services.map((x: any) => x.count));
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-900 truncate">{s.service}</span>
                        <span className="text-gray-500 font-medium">{s.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parts Usage (Top 20)</h2>
            {partsLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : parts?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No parts used yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Part</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Qty Used</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parts?.map((p: any) => (
                    <tr key={p.part_id}>
                      <td className="py-2 text-gray-900">{p.part_name}</td>
                      <td className="py-2 text-right text-gray-600">{p.total_used}</td>
                      <td className="py-2 text-right text-gray-600">${parseFloat(p.total_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Appointment Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h2>
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
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${colorMap[s.status] || 'bg-gray-400'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
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