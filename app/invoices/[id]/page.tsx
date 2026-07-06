'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { DetailSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCreditCard } from 'react-icons/hi2';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <Navbar />
        <div className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <Navbar />
        <div className="w-full lg:ml-64 px-4 py-8 text-center text-gray-500">Invoice not found.</div>
      </div>
    );
  }

  const inv = data;
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WorkshopManager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <HiOutlineDocumentText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{inv.invoice_number}</h1>
            <p className="text-sm text-gray-500">Created {new Date(inv.created_at).toLocaleDateString()}</p>
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

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 text-sm">
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

        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden mb-6 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {inv.lineItems?.map((li: any) => (
                <tr key={li.id} className="hover:bg-gray-50/50 transition-colors">
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
                <td className="px-4 py-3 text-right font-bold text-lg text-emerald-600">${parseFloat(inv.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {inv.notes && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
            <p className="text-sm text-gray-600">{inv.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
          <div className="flex gap-3 flex-wrap">
            {canManage && inv.status === 'DRAFT' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'ISSUED' })}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 shadow-sm transition-all"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                {updateStatus.isPending ? 'Updating...' : 'Issue Invoice'}
              </button>
            )}
            {canManage && inv.status === 'ISSUED' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'PAID', paidAt: new Date().toISOString() })}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                {updateStatus.isPending ? 'Updating...' : 'Mark as Paid'}
              </button>
            )}
            {inv.status === 'ISSUED' && (
              <button
                onClick={() => payChapa.mutate()}
                disabled={payChapa.isPending}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
              >
                <HiOutlineCreditCard className="w-4 h-4" />
                {payChapa.isPending ? 'Processing...' : 'Pay with Chapa'}
              </button>
            )}
            {canManage && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
              <button
                onClick={() => updateStatus.mutate({ status: 'CANCELLED' })}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50 border border-red-200 transition-all"
              >
                <HiOutlineXCircle className="w-4 h-4" />
                {updateStatus.isPending ? 'Updating...' : 'Cancel Invoice'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      </main>
    </div>
  );
}