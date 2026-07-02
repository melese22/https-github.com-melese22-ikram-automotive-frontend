'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useState } from 'react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => {
      const { data } = await api.get(`/invoices?page=${page}&limit=20`);
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const data = invoicesData?.invoices;
  const total = invoicesData?.total || 0;
  const totalPages = invoicesData?.totalPages || 0;

  if (!user || user.role === 'Customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Not available for customers.</div>
      </div>
    );
  }

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const filtered = (data || []).filter((inv: any) =>
    !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.plate_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <input
            type="text"
            placeholder="Search by number, customer, plate..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-72 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            {search ? 'No invoices match your search.' : 'No invoices yet. Generate an invoice from a job card.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filtered.map((inv: any) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.make} {inv.model} ({inv.plate_number || '—'})
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">${parseFloat(inv.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
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