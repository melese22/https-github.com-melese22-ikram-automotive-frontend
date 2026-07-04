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
import { HiOutlineCube, HiOutlineMagnifyingGlass, HiOutlinePlusCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <HiOutlineCube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parts Inventory</h2>
              <p className="text-sm text-gray-500">Manage stock levels and track parts</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow-md transition-all"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Part'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlinePlusCircle className="w-4 h-4 text-amber-500" />
              Add New Part
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  {['general', 'engine', 'brakes', 'suspension', 'electrical', 'body', 'interior', 'tires', 'fluids', 'filters'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                <input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                <input type="number" value={form.minStock} onChange={(e) => setForm({...form, minStock: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white" rows={2} />
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 shadow-sm transition-all">
              {createMutation.isPending ? 'Adding...' : 'Add Part'}
            </button>
          </form>
        )}

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, SKU, category..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
          <button
            onClick={() => { setFilterLow(!filterLow); setPage(1); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              filterLow ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <HiOutlineExclamationTriangle className="w-4 h-4" />
            {filterLow ? 'Low Stock' : 'All Parts'}
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineCube className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No parts found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Part</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered?.map((p: any) => {
                  const isLow = p.quantity <= p.min_stock;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{p.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {p.quantity}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                              <HiOutlineExclamationTriangle className="w-3 h-3" />
                              Low
                            </span>
                          )}
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => adjustStock.mutate({ id: p.id, delta: 1 })}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 w-5 h-5 rounded font-bold"
                              title="Add 1"
                            >+</button>
                            <button
                              onClick={() => adjustStock.mutate({ id: p.id, delta: -1 })}
                              disabled={p.quantity < 1}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-red-500 w-5 h-5 rounded font-bold disabled:opacity-30"
                              title="Remove 1"
                            >−</button>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Min: {p.min_stock}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">${parseFloat(p.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.supplier || '—'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deactivatePart.mutate(p.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium"
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