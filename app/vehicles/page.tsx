'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { HiOutlineTruck, HiOutlineMagnifyingGlass, HiOutlinePlusCircle } from 'react-icons/hi2';

export default function VehiclesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    plateNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
    customerId: '',
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.users?.filter((u: any) => u.role === 'Customer') || [];
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles', page],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles?page=${page}&limit=20`);
      return data;
    },
  });

  const vehicles = vehiclesData?.vehicles;
  const total = vehiclesData?.total || 0;
  const totalPages = vehiclesData?.totalPages || 0;

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data } = await api.post('/vehicles', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle registered!');
      setShowCreate(false);
      setForm({ plateNumber: '', chassisNumber: '', make: '', model: '', year: '', vin: '', mileage: '', customerId: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to register vehicle');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.customerId) {
      return toast.error('Make, model, and customer are required');
    }
    createMutation.mutate(form);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const filteredVehicles = search
    ? vehicles?.filter((v: any) =>
        [v.plate_number, v.chassis_number, v.vin, v.make, v.model, v.customer_phone]
          .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
      )
    : vehicles;

  if (!user || user.role === 'Customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="w-full lg:ml-64 px-4 py-8">
          <p className="text-center text-gray-500">You do not have access to this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <HiOutlineTruck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vehicle Registry</h2>
              <p className="text-sm text-gray-500">Track all registered vehicles</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-cyan-700 hover:to-blue-700 shadow-sm hover:shadow-md transition-all"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            {showCreate ? 'Cancel' : 'Register Vehicle'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlinePlusCircle className="w-4 h-4 text-cyan-500" />
              Register New Vehicle
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="Toyota" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="Camry" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="2024" type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="AA 12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="1HGCM82633A004352" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chassis Number</label>
                <input value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="CH-123456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
                <input value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" placeholder="15000" type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white" required>
                  <option value="">Select customer</option>
                  {customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 shadow-sm transition-all">
              {createMutation.isPending ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>
        )}

        <div className="relative mb-4">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by plate, VIN, chassis, make, model, or customer phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          />
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredVehicles?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineTruck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No vehicles found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plate</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">VIN</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVehicles?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{v.make} {v.model} {v.year ? `(${v.year})` : ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{v.plate_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{v.vin || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.customer_name}<br /><span className="text-xs text-gray-400">{v.customer_phone}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.mileage ? `${v.mileage.toLocaleString()} km` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(v.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
      </main>
    </div>
  );
}
