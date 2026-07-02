'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import MediaUploader from '@/components/MediaUploader';
import MilestoneTracker from '@/components/MilestoneTracker';
import { DetailSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState, useRef } from 'react';

export default function JobCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'details' | 'milestones' | 'media' | 'notifications' | 'parts' | 'invoices'>('details');
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [notifType, setNotifType] = useState<'sms' | 'email'>('sms');
  const [notifMessage, setNotifMessage] = useState('');
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [laborCost, setLaborCost] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: jobCard, isLoading } = useQuery({
    queryKey: ['job-card', id],
    queryFn: async () => {
      const { data } = await api.get(`/job-cards/${id}`);
      return data.jobCard;
    },
  });

  const canEdit = user?.role !== 'Customer';
  const isCustomer = user?.role === 'Customer';

  const { data: mediaData } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const { data } = await api.get(`/media/job-card/${id}`);
      return data.media;
    },
    enabled: tab === 'media',
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', id],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/job-card/${id}`);
      return data.notifications;
    },
    enabled: tab === 'notifications',
  });

  const sendNotif = useMutation({
    mutationFn: async (payload: { type: string; to: string; subject?: string; message: string }) => {
      const { data } = await api.post('/notifications/send', { ...payload, jobCardId: id });
      return data;
    },
    onSuccess: () => {
      toast.success('Notification sent!');
      setShowNotifForm(false);
      setNotifMessage('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send'),
  });

  const { data: partsData } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const { data } = await api.get('/parts');
      return data.parts;
    },
    enabled: tab === 'parts' && canEdit,
  });

  const { data: invoiceData } = useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/job-card/${id}`);
      return data.invoices;
    },
    enabled: tab === 'invoices',
  });

  const { data: partsUsedData } = useQuery({
    queryKey: ['parts-used', id],
    queryFn: async () => {
      const { data } = await api.get(`/parts/${id}/used`);
      return data;
    },
    enabled: tab === 'parts',
  });

  const usePart = useMutation({
    mutationFn: async ({ partId, quantity }: { partId: string; quantity: number }) => {
      const { data } = await api.post(`/parts/${id}/use`, { partId, quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-used', id] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part added to job card!');
      setShowPartSelector(false);
      setSelectedPartId('');
      setPartQty('1');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to use part'),
  });

  const removeUsedPart = useMutation({
    mutationFn: async (usedId: string) => {
      const { data } = await api.delete(`/parts/used/${usedId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-used', id] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part usage removed and restocked.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to remove part'),
  });

  const generateInvoice = useMutation({
    mutationFn: async (payload: { jobCardId: string; laborCost: number; taxRate: number; notes?: string }) => {
      const { data } = await api.post('/invoices/generate', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
      toast.success('Invoice generated!');
      setShowInvoiceForm(false);
      setLaborCost('0');
      setTaxRate('0');
      setInvoiceNotes('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate invoice'),
  });

  const generateTracking = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tracking/generate', { jobCardId: id });
      return data;
    },
    onSuccess: (data) => {
      setTrackingUrl(data.trackingUrl);
      toast.success('Tracking link generated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate link'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <DetailSkeleton />
          <div className="animate-pulse flex gap-6 border-b border-gray-200 pb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
          Job card not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {jobCard.make} {jobCard.model} {jobCard.year ? `(${jobCard.year})` : ''}
              </h1>
              <p className="text-gray-500">{jobCard.plate_number || jobCard.vin || 'No plate'}</p>
            </div>
            <StatusBadge status={jobCard.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Customer:</span>
              <span className="ml-2 text-gray-900">{jobCard.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 text-gray-900">{jobCard.customer_phone}</span>
            </div>
            {jobCard.mechanic_name && (
              <div>
                <span className="text-gray-500">Mechanic:</span>
                <span className="ml-2 text-gray-900">{jobCard.mechanic_name}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">VIN:</span>
              <span className="ml-2 text-gray-900 font-mono text-xs">{jobCard.vin || 'N/A'}</span>
            </div>
          </div>
          {jobCard.description && (
            <p className="text-gray-600 border-t border-gray-100 pt-4 mt-4">{jobCard.description}</p>
          )}
        </div>

        {!isCustomer && (
          <div className="mb-6">
            <button
              onClick={() => generateTracking.mutate()}
              disabled={generateTracking.isPending}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {generateTracking.isPending ? 'Generating...' : 'Generate Client Tracking Link'}
            </button>
            {trackingUrl && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={trackingUrl}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(trackingUrl); toast.success('Copied!'); }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {(['details', 'milestones', 'media', 'parts', 'notifications', 'invoices'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'media' ? 'Photos & Media' : t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'milestones' && canEdit && (
          <MilestoneTracker jobCardId={id} />
        )}
        {tab === 'milestones' && !canEdit && (
          <p className="text-gray-400 text-sm">Milestone tracking available for workshop staff.</p>
        )}

        {tab === 'media' && canEdit && (
          <div className="space-y-6">
            <MediaUploader jobCardId={id} />
            {mediaData?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Media ({mediaData.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaData.map((item: any) => (
                    <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={item.thumbUrl || item.fileUrl}
                        alt={item.original_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-gray-900 px-3 py-1 rounded text-xs font-medium"
                        >
                          View
                        </a>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                        <div className="flex gap-1">
                          {item.tags?.map((tag: string) => (
                            <span key={tag} className="text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'notifications' && canEdit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifForm(!showNotifForm)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showNotifForm ? 'Cancel' : '+ Send Notification'}
              </button>
            </div>

            {showNotifForm && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setNotifType('sms')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      notifType === 'sms' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setNotifType('email')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      notifType === 'email' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    Email
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  To: {notifType === 'sms' ? jobCard.customer_phone : (jobCard.customer_email || jobCard.customer_phone)}
                </div>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder={`Type your ${notifType} message...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <button
                  onClick={() => sendNotif.mutate({
                    type: notifType,
                    to: notifType === 'sms' ? jobCard.customer_phone : (jobCard.customer_email || jobCard.customer_phone),
                    message: notifMessage,
                  })}
                  disabled={!notifMessage || sendNotif.isPending}
                  className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {sendNotif.isPending ? 'Sending...' : `Send ${notifType.toUpperCase()}`}
                </button>
              </div>
            )}

            {notifData?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
                No notifications sent for this job card.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notifData?.map((n: any) => (
                      <tr key={n.id} className="text-sm">
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            n.recipient_type === 'sms' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>{n.recipient_type.toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{n.recipient_address}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{n.subject || n.message}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            n.status === 'sent' ? 'bg-green-100 text-green-700' :
                            n.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{n.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{n.sent_at ? new Date(n.sent_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'notifications' && !canEdit && (
          <p className="text-gray-400 text-sm">Notification history available for workshop staff.</p>
        )}

        {tab === 'parts' && canEdit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Parts Used</h3>
              <button
                onClick={() => setShowPartSelector(!showPartSelector)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showPartSelector ? 'Cancel' : '+ Add Part'}
              </button>
            </div>

            {showPartSelector && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                {partsData?.length === 0 ? (
                  <p className="text-sm text-gray-400">No parts in inventory. <a href="/inventory" className="text-primary-600">Add parts first.</a></p>
                ) : (
                  <>
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a part...</option>
                      {partsData?.filter((p: any) => p.quantity > 0).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.quantity} in stock @ ${parseFloat(p.unit_price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <button
                        onClick={() => usePart.mutate({ partId: selectedPartId, quantity: parseInt(partQty) || 1 })}
                        disabled={!selectedPartId || usePart.isPending}
                        className="mt-5 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                        {usePart.isPending ? 'Adding...' : 'Use Part'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {partsUsedData?.partsUsed?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
                No parts used on this job card yet.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {partsUsedData?.partsUsed?.map((pu: any) => (
                      <tr key={pu.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{pu.part_name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono">{pu.part_sku}</td>
                        <td className="px-4 py-3 text-right">{pu.quantity}</td>
                        <td className="px-4 py-3 text-right">${parseFloat(pu.unit_price_at_use).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold">${(pu.quantity * pu.unit_price_at_use).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeUsedPart.mutate(pu.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Undo
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-4 py-3 text-right text-gray-700">Total Parts Cost</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ${parseFloat(partsUsedData?.total || 0).toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'parts' && !canEdit && (
          <p className="text-gray-400 text-sm">Parts usage available for workshop staff.</p>
        )}

        {tab === 'invoices' && (
          <div className="space-y-6">
            {canEdit && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                  <button
                    onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showInvoiceForm ? 'Cancel' : '+ Generate Invoice'}
                  </button>
                </div>

                {showInvoiceForm && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 mb-4">
                    <p className="text-sm text-gray-500">
                      Parts total will be calculated from the existing parts used on this job card.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Labor Cost ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={laborCost}
                          onChange={(e) => setLaborCost(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                      <textarea
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => generateInvoice.mutate({
                        jobCardId: id,
                        laborCost: parseFloat(laborCost) || 0,
                        taxRate: parseFloat(taxRate) || 0,
                        notes: invoiceNotes || undefined,
                      })}
                      disabled={generateInvoice.isPending || (!parseFloat(laborCost) && !parseFloat(taxRate) && !invoiceNotes)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!invoiceData || invoiceData.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
                No invoices for this job card.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {invoiceData.map((inv: any) => (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-right">${parseFloat(inv.subtotal).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${parseFloat(inv.tax_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold">${parseFloat(inv.total).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            inv.status === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                            inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 text-xs">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Job Card Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd>{new Date(jobCard.created_at).toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Last Updated</dt><dd>{new Date(jobCard.updated_at).toLocaleString()}</dd></div>
              {jobCard.started_at && <div className="flex justify-between"><dt className="text-gray-500">Started</dt><dd>{new Date(jobCard.started_at).toLocaleString()}</dd></div>}
              {jobCard.completed_at && <div className="flex justify-between"><dt className="text-gray-500">Completed</dt><dd>{new Date(jobCard.completed_at).toLocaleString()}</dd></div>}
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}