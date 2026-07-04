'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useState } from 'react';
import { HiOutlineReceiptPercent, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <HiOutlineReceiptPercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
              <p className="text-sm text-gray-500">Manage billing and payments</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by number, customer, plate..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineReceiptPercent className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{search ? 'No invoices match your search.' : 'No invoices yet'}</p>
            {!search && <p className="text-gray-400 text-sm mt-1">Generate an invoice from a job card.</p>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((inv: any) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3.5 text-gray-600">{inv.customer_name}</td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {inv.make} {inv.model} ({inv.plate_number || '—'})
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">${parseFloat(inv.total).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-400">
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