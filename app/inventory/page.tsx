'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InventoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: '', sku: '', category: 'general', description: '',
    quantity: '0', unitPrice: '0', supplier: '', minStock: '5',
  });

  useEffect(() => {
    if (!loading && (!user || user.role === 'Customer')) {
      router.push(user ? '/job-cards' : '/login');
    }
  }, [user, loading, router]);

  const { data: partsData, isLoading } = useQuery({
    queryKey: ['parts', filterLow, page],
    queryFn: async () => {
      const endpoint = filterLow ? '/parts/low-stock' : `/parts?page=${page}&limit=20`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const parts = partsData?.parts;
  const total = filterLow ? (parts?.length || 0) : (partsData?.total || 0);
  const totalPages = filterLow ? 1 : (partsData?.totalPages || 0);

  const createMutation = useMutation({
    mutationFn: async (d: any) => {
      const { data } = await api.post('/parts', d);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part added!');
      setShowForm(false);
      setForm({ name: '', sku: '', category: 'general', description: '', quantity: '0', unitPrice: '0', supplier: '', minStock: '5' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add part'),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const { data } = await api.patch(`/parts/${id}/stock`, { delta });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Stock adjusted!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to adjust stock'),
  });

  const deactivatePart = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/parts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part removed.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to remove part'),
  });

  const filtered = search
    ? parts?.filter((p: any) =>
        [p.name, p.sku, p.category, p.supplier].some(f => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : parts;

  if (loading || !user || user.role === 'Customer') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Parts Inventory</h2>
            <p className="text-gray-500 mt-1">Manage stock levels and track parts used on job cards</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            {showForm ? 'Cancel' : '+ Add Part'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Part</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                  {['general', 'engine', 'brakes', 'suspension', 'electrical', 'body', 'interior', 'tires', 'fluids', 'filters'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                <input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                <input type="number" value={form.minStock} onChange={(e) => setForm({...form, minStock: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" rows={2} />
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {createMutation.isPending ? 'Adding...' : 'Add Part'}
            </button>
          </form>
        )}

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU, category..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => { setFilterLow(!filterLow); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              filterLow ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            {filterLow ? 'Low Stock' : 'All Parts'}
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No parts found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered?.map((p: any) => {
                  const isLow = p.quantity <= p.min_stock;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${isLow ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {p.quantity}
                          </span>
                          {isLow && <span className="text-xs text-red-500">Low</span>}
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => adjustStock.mutate({ id: p.id, delta: 1 })}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              title="Add 1"
                            >+</button>
                            <button
                              onClick={() => adjustStock.mutate({ id: p.id, delta: -1 })}
                              disabled={p.quantity < 1}
                              className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-30"
                              title="Remove 1"
                            >−</button>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400">Min: {p.min_stock}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">${parseFloat(p.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.supplier || '—'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deactivatePart.mutate(p.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!filterLow && <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />}
      </main>
    </div>
  );
}