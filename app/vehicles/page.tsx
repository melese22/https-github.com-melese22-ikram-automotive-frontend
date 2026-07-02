'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

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
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">You do not have access to this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Registry</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            {showCreate ? 'Cancel' : '+ Register Vehicle'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Register New Vehicle</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Toyota" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Camry" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="2024" type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="AA 12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="1HGCM82633A004352" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chassis Number</label>
                <input value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="CH-123456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
                <input value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="15000" type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                  <option value="">Select customer</option>
                  {customers?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={createMutation.isPending} className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {createMutation.isPending ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by plate, VIN, chassis, make, model, or customer phone..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredVehicles?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No vehicles found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVehicles?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.make} {v.model} {v.year ? `(${v.year})` : ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.plate_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{v.vin || '—'}</td>
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
