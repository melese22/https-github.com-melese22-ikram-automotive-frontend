import StatusBadge from './StatusBadge';

interface JobCardData {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  customer_name: string;
  customer_phone: string;
  mechanic_name: string | null;
  description: string;
  status: string;
  created_at: string;
}

export default function JobCardCard({ jobCard }: { jobCard: JobCardData }) {
  const timeSinceCreation = () => {
    const diff = Date.now() - new Date(jobCard.created_at).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Less than an hour';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isDelayed = jobCard.status === 'DIAGNOSTIC' &&
    (Date.now() - new Date(jobCard.created_at).getTime()) > 4 * 3600000;

  return (
    <div className={`bg-white rounded-lg border p-5 transition-shadow hover:shadow-md ${
      isDelayed ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {jobCard.make} {jobCard.model} {jobCard.year ? `(${jobCard.year})` : ''}
          </h3>
          <p className="text-sm text-gray-500">{jobCard.plate_number || 'No plate'}</p>
        </div>
        <StatusBadge status={jobCard.status} />
      </div>

      {isDelayed && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md font-medium">
          Delayed in diagnostic — over 4 hours
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p><span className="font-medium">Customer:</span> {jobCard.customer_name} ({jobCard.customer_phone})</p>
        {jobCard.mechanic_name && (
          <p><span className="font-medium">Mechanic:</span> {jobCard.mechanic_name}</p>
        )}
        <p><span className="font-medium">VIN:</span> {jobCard.vin || 'N/A'}</p>
      </div>

      {jobCard.description && (
        <p className="text-sm text-gray-500 border-t border-gray-100 pt-2 mt-2">
          {jobCard.description}
        </p>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Created {timeSinceCreation()}</span>
      </div>
    </div>
  );
}
