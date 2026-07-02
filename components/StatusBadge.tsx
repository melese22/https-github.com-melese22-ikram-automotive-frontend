import clsx from 'clsx';

const statusClasses: Record<string, string> = {
  PENDING: 'status-pending',
  DIAGNOSTIC: 'status-diagnostic',
  IN_PROGRESS: 'status-in-progress',
  TEST_DRIVE: 'status-test-drive',
  COMPLETED: 'status-completed',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  DIAGNOSTIC: 'Diagnostic',
  IN_PROGRESS: 'In Progress',
  TEST_DRIVE: 'Test Drive',
  COMPLETED: 'Completed',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
        statusClasses[status] || 'bg-gray-100 text-gray-800'
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
