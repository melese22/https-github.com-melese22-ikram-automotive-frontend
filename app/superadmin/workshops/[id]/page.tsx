'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['workshop', id],
    queryFn: async () => {
      const { data } = await api.get(`/workshops/${id}`);
      return data;
    },
    enabled: !!user && !!id && user.role === 'SuperAdmin',
  });

  const updateWorkshop = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.patch(`/workshops/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', id] });
      setEditing(false);
      toast.success('Workshop updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  if (loading || isLoading) {
    return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400 animate-pulse">Loading...</div></div>;
  }
  if (!user || user.role !== 'SuperAdmin') return null;
  if (!data || !data.workshop) {
    return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-center text-gray-500">Workshop not found.</div></div>;
  }

  const { workshop, stats } = data;
  const roleCounts = stats?.users || [];

  const startEdit = () => {
    setForm({ name: workshop.name, address: workshop.address || '', phone: workshop.phone || '', email: workshop.email || '' });
    setEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.push('/superadmin')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back to SuperAdmin
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workshop.name}</h1>
              <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                {workshop.address && <p>{workshop.address}</p>}
                {workshop.phone && <p>{workshop.phone}</p>}
                {workshop.email && <p>{workshop.email}</p>}
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${workshop.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {workshop.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{roleCounts.reduce((s: number, r: any) => s + r.count, 0)}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Users</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.jobCards?.active || 0}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Active Jobs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{stats?.vehicles || 0}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Vehicles</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${Math.round(stats?.revenue?.total_revenue || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">Revenue</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>
            {roleCounts.length === 0 ? (
              <p className="text-sm text-gray-400">No users.</p>
            ) : (
              <div className="space-y-3">
                {roleCounts.map((r: any) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{r.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{r.count}</span>
                      {r.active !== undefined && (
                        <span className="text-xs text-gray-400">({r.active} active)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Cards</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total</span>
                <span className="font-semibold">{stats?.jobCards?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Active</span>
                <span className="font-semibold text-purple-600">{stats?.jobCards?.active || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Completed</span>
                <span className="font-semibold text-green-600">{stats?.jobCards?.completed || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Workshop Settings</h2>
            {!editing && (
              <button onClick={startEdit} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={workshop.is_active}
                    onChange={(e) => updateWorkshop.mutate({ is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateWorkshop.mutate(form)}
                  disabled={updateWorkshop.isPending}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {updateWorkshop.isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Click Edit to modify workshop details.</div>
          )}
        </div>
      </main>
    </div>
  );
}