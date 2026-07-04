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
import { HiOutlineWrench, HiOutlineArrowLeft, HiOutlineLink, HiOutlineClipboard, HiOutlinePhoto, HiOutlineBellAlert, HiOutlineCube, HiOutlineDocumentText, HiOutlineInformationCircle } from 'react-icons/hi2';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
          Job card not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/job-cards')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Job Cards
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <HiOutlineWrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {jobCard.make} {jobCard.model} {jobCard.year ? `(${jobCard.year})` : ''}
            </h1>
            <p className="text-sm text-gray-500">{jobCard.plate_number || jobCard.vin || 'No plate'}</p>
          </div>
          <StatusBadge status={jobCard.status} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
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
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
            >
              <HiOutlineLink className="w-4 h-4" />
              {generateTracking.isPending ? 'Generating...' : 'Generate Client Tracking Link'}
            </button>
            {trackingUrl && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={trackingUrl}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(trackingUrl); toast.success('Copied!'); }}
                  className="inline-flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-all"
                >
                  <HiOutlineClipboard className="w-4 h-4" />
                  Copy
                </button>
              </div>
            )}
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6 overflow-x-auto">
            {(['details', 'milestones', 'media', 'parts', 'notifications', 'invoices'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'details' && <HiOutlineInformationCircle className="w-4 h-4" />}
                {t === 'milestones' && <HiOutlineWrench className="w-4 h-4" />}
                {t === 'media' && <HiOutlinePhoto className="w-4 h-4" />}
                {t === 'parts' && <HiOutlineCube className="w-4 h-4" />}
                {t === 'notifications' && <HiOutlineBellAlert className="w-4 h-4" />}
                {t === 'invoices' && <HiOutlineDocumentText className="w-4 h-4" />}
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
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                  <HiOutlinePhoto className="w-4 h-4 text-indigo-500" />
                  Uploaded Media ({mediaData.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaData.map((item: any) => (
                    <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
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
                          className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
                        >
                          View
                        </a>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <div className="flex gap-1 flex-wrap">
                          {item.tags?.map((tag: string) => (
                            <span key={tag} className="text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded font-medium">
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
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HiOutlineBellAlert className="w-5 h-5 text-rose-500" />
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifForm(!showNotifForm)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showNotifForm ? 'Cancel' : '+ Send Notification'}
              </button>
            </div>

            {showNotifForm && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 shadow-sm">
                <div className="flex gap-3">
                  <button
                    onClick={() => setNotifType('sms')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      notifType === 'sms' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setNotifType('email')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      notifType === 'email' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
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
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  rows={3}
                />
                <button
                  onClick={() => sendNotif.mutate({
                    type: notifType,
                    to: notifType === 'sms' ? jobCard.customer_phone : (jobCard.customer_email || jobCard.customer_phone),
                    message: notifMessage,
                  })}
                  disabled={!notifMessage || sendNotif.isPending}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  {sendNotif.isPending ? 'Sending...' : `Send ${notifType.toUpperCase()}`}
                </button>
              </div>
            )}

            {notifData?.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <HiOutlineBellAlert className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No notifications sent for this job card.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {notifData?.map((n: any) => (
                        <tr key={n.id} className="text-sm hover:bg-gray-50/50 transition-colors">
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
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HiOutlineCube className="w-5 h-5 text-amber-500" />
                Parts Used
              </h3>
              <button
                onClick={() => setShowPartSelector(!showPartSelector)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showPartSelector ? 'Cancel' : '+ Add Part'}
              </button>
            </div>

            {showPartSelector && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 shadow-sm">
                {partsData?.length === 0 ? (
                  <p className="text-sm text-gray-400">No parts in inventory. <a href="/inventory" className="text-indigo-600 font-medium">Add parts first.</a></p>
                ) : (
                  <>
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select a part...</option>
                      {partsData?.filter((p: any) => p.quantity > 0).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.quantity} in stock @ ${parseFloat(p.unit_price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => usePart.mutate({ partId: selectedPartId, quantity: parseInt(partQty) || 1 })}
                        disabled={!selectedPartId || usePart.isPending}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
                      >
                        {usePart.isPending ? 'Adding...' : 'Use Part'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {partsUsedData?.partsUsed?.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <HiOutlineCube className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No parts used on this job card yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {partsUsedData?.partsUsed?.map((pu: any) => (
                        <tr key={pu.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{pu.part_name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono">{pu.part_sku}</td>
                          <td className="px-4 py-3 text-right">{pu.quantity}</td>
                          <td className="px-4 py-3 text-right">${parseFloat(pu.unit_price_at_use).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold">${(pu.quantity * pu.unit_price_at_use).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeUsedPart.mutate(pu.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium"
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
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5 text-emerald-500" />
                    Invoices
                  </h3>
                  <button
                    onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {showInvoiceForm ? 'Cancel' : '+ Generate Invoice'}
                  </button>
                </div>

                {showInvoiceForm && (
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3 mb-4 shadow-sm">
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
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                      <textarea
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
                    >
                      {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!invoiceData || invoiceData.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <HiOutlineDocumentText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No invoices for this job card.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {invoiceData.map((inv: any) => (
                        <tr
                          key={inv.id}
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors"
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
              </div>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineInformationCircle className="w-5 h-5 text-indigo-500" />
              Job Card Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1"><dt className="text-gray-500">Created</dt><dd className="font-medium">{new Date(jobCard.created_at).toLocaleString()}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-gray-500">Last Updated</dt><dd className="font-medium">{new Date(jobCard.updated_at).toLocaleString()}</dd></div>
              {jobCard.started_at && <div className="flex justify-between py-1"><dt className="text-gray-500">Started</dt><dd className="font-medium">{new Date(jobCard.started_at).toLocaleString()}</dd></div>}
              {jobCard.completed_at && <div className="flex justify-between py-1"><dt className="text-gray-500">Completed</dt><dd className="font-medium text-green-600">{new Date(jobCard.completed_at).toLocaleString()}</dd></div>}
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}