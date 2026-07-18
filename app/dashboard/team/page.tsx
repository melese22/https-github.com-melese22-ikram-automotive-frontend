'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { StatCardSkeleton, SkeletonBlock } from '@/components/Skeleton';
import {
  HiOutlineUserGroup,
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFunnel,
} from 'react-icons/hi2';

const ROLES = ['WorkshopManager', 'Mechanic', 'Customer'] as const;
const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-red-100 text-red-700',
  WorkshopManager: 'bg-blue-100 text-blue-700',
  Mechanic: 'bg-amber-100 text-amber-700',
  Customer: 'bg-emerald-100 text-emerald-700',
};

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'Customer' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SuperAdmin' && user.role !== 'WorkshopManager'))) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['team-users', filterRole],
    queryFn: async () => {
      const params = filterRole ? `?role=${filterRole}` : '';
      const { data } = await api.get(`/user-management${params}`);
      return data;
    },
    enabled: !!user && ['SuperAdmin', 'WorkshopManager'].includes(user.role),
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { data } = await api.post('/user-management', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', password: '', role: 'Customer' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to create user.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/user-management/${id}/toggle-active`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonBlock className="h-7 w-48 mb-8" />
          <StatCardSkeleton count={4} />
        </main>
      </div>
    );
  }

  if (!user || !['SuperAdmin', 'WorkshopManager'].includes(user.role)) return null;

  const users = data?.users || [];

  const roleCounts = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <HiOutlineUserGroup className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="text-sm text-gray-500">{users.length} users in this workshop</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(filterRole === role ? '' : role)}
              className={`bg-white rounded-xl border p-3 text-left transition-all ${
                filterRole === role ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold text-gray-900">{roleCounts[role] || 0}</div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{role.replace(/([A-Z])/g, ' $1').trim()}</div>
            </button>
          ))}
        </div>

        {filterRole && (
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineFunnel className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-indigo-700 font-medium">Filtered: {filterRole}</span>
            <button onClick={() => setFilterRole('')} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Team Member</h3>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">{formError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.phone || !form.password}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <SkeletonBlock className="h-4 w-32 mb-2" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineUserGroup className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No team members found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.phone}{u.email ? ` · ${u.email}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    {u.is_active ? (
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <HiOutlineXCircle className="w-4 h-4 text-red-400" />
                    )}
                    <button
                      onClick={() => toggleMutation.mutate(u.id)}
                      disabled={toggleMutation.isPending || u.id === user.id}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
