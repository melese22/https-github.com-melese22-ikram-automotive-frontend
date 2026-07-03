'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { DetailSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const itemTypeStyles: Record<string, string> = {
  labor: 'text-purple-700 bg-purple-100',
  part: 'text-blue-700 bg-blue-100',
  other: 'text-gray-700 bg-gray-100',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data.invoice;
    },
    enabled: !!user,
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('paid') === 'pending') {
      const check = setInterval(async () => {
        try {
          const { data } = await api.get(`/invoices/${id}/payment-status`);
          if (data.status === 'PAID') {
            clearInterval(check);
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
            toast.success('Payment confirmed!');
          }
        } catch {}
      }, 5000);
      return () => clearInterval(check);
    }
  }, [id, searchParams, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ status, paidAt }: { status: string; paidAt?: string }) => {
      const { data } = await api.patch(`/invoices/${id}/status`, { status, paidAt });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const payChapa = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/invoices/${id}/pay`);
      return data;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Payment initiation failed'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <DetailSkeleton />
          <div className="animate-pulse bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 px-4 py-3"><div className="h-3 bg-gray-300 rounded w-3/4" /></div>
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className="flex border-b border-gray-100">
                {Array.from({ length: 5 }).map((_, c) => (
                  <div key={c} className="flex-1 px-4 py-3"><div className="h-4 bg-gray-200 rounded" style={{ width: `${50 + (c * 10) % 40}%` }} /></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Invoice not found.</div>
      </div>
    );
  }

  const inv = data;
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WorkshopManager';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/invoices')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Invoices
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{inv.invoice_number}</h1>
              <p className="text-gray-500 mt-1">Created {new Date(inv.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusStyles[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                {inv.status}
              </span>
              {inv.status === 'PAID' && inv.paid_at && (
                <p className="text-xs text-gray-400 mt-1">Paid {new Date(inv.paid_at).toLocaleDateString()}</p>
              )}
              {inv.status === 'ISSUED' && inv.issued_at && (
                <p className="text-xs text-gray-400 mt-1">Issued {new Date(inv.issued_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm border-t border-gray-100 pt-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Customer</h3>
              <p className="text-gray-600">{inv.customer_name}</p>
              {inv.customer_phone && <p className="text-gray-500">{inv.customer_phone}</p>}
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Vehicle</h3>
              <p className="text-gray-600">
                {inv.make} {inv.model} {inv.plate_number ? `(${inv.plate_number})` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {inv.lineItems?.map((li: any) => (
                <tr key={li.id}>
                  <td className="px-4 py-3 text-gray-900">{li.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${itemTypeStyles[li.item_type] || ''}`}>
                      {li.item_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{li.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${parseFloat(li.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">${parseFloat(li.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 text-sm">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-gray-600">Subtotal</td>
                <td className="px-4 py-3 text-right font-semibold">${parseFloat(inv.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-gray-600">Tax ({inv.tax_rate}%)</td>
                <td className="px-4 py-3 text-right font-semibold">${parseFloat(inv.tax_amount).toFixed(2)}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td colSpan={4} className="px-4 py-3 text-right text-gray-900 font-bold">Total</td>
                <td className="px-4 py-3 text-right font-bold text-lg">${parseFloat(inv.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {inv.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
            <p className="text-sm text-gray-600">{inv.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
          <div className="flex gap-3 flex-wrap">
            {canManage && inv.status === 'DRAFT' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'ISSUED' })}
                disabled={updateStatus.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : 'Issue Invoice'}
              </button>
            )}
            {canManage && inv.status === 'ISSUED' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'PAID', paidAt: new Date().toISOString() })}
                disabled={updateStatus.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : 'Mark as Paid'}
              </button>
            )}
            {inv.status === 'ISSUED' && (
              <button
                onClick={() => payChapa.mutate()}
                disabled={payChapa.isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {payChapa.isPending ? 'Processing...' : 'Pay with Chapa'}
                {!payChapa.isPending && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            )}
            {canManage && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'CANCELLED' })}
                disabled={updateStatus.isPending}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : 'Cancel Invoice'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Print Invoice
          </button>
        </div>
      </main>
    </div>
  );
}