'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MilestoneTrackerProps {
  jobCardId: string;
}

export default function MilestoneTracker({ jobCardId }: MilestoneTrackerProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});

  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['milestones', jobCardId],
    queryFn: async () => {
      const { data } = await api.get(`/milestones/job-card/${jobCardId}`);
      return data.milestones;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: { title: string; description: string }) => {
      const { data } = await api.post('/milestones', { ...formData, jobCardId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', jobCardId] });
      toast.success('Milestone added!');
      setShowCreate(false);
      setTitle('');
      setDescription('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create milestone'),
  });

  const transitionMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/milestones/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', jobCardId] });
      toast.success('Milestone updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update milestone'),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', jobCardId] });
      toast.success('Milestone deleted.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete milestone'),
  });

  const addTask = useMutation({
    mutationFn: async ({ milestoneId, title }: { milestoneId: string; title: string }) => {
      const { data } = await api.post(`/milestones/${milestoneId}/tasks`, { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', jobCardId] });
      setNewTaskTitles({});
      toast.success('Task added!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add task'),
  });

  const transitionTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/milestones/tasks/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', jobCardId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update task'),
  });

  const deleteMilestoneMutation = deleteMilestone;
  const addTaskMutation = addTask;
  const transitionTaskMutation = transitionTask;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Customization Milestones</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showCreate ? 'Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone title (e.g., Paint Job)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
          <button
            onClick={() => createMutation.mutate({ title, description })}
            disabled={!title || createMutation.isPending}
            className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Milestone'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-400 animate-pulse">Loading milestones...</div>
      ) : milestonesData?.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No milestones yet. Add the first one!
        </div>
      ) : (
        <div className="space-y-3">
          {milestonesData?.map((milestone: any) => (
            <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => transitionMilestone.mutate({
                      id: milestone.id,
                      status: milestone.status === 'PENDING' ? 'IN_PROGRESS' :
                              milestone.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING',
                    })}
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      milestone.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white' :
                      milestone.status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-50' :
                      milestone.status === 'SKIPPED' ? 'border-gray-300 bg-gray-100' :
                      'border-gray-300'
                    }`}
                  >
                    {milestone.status === 'COMPLETED' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {milestone.status === 'IN_PROGRESS' && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                    {milestone.status === 'SKIPPED' && (
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <h4 className={`font-medium text-sm ${milestone.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                  className="text-gray-300 hover:text-red-500 text-xs ml-2"
                >
                  ×
                </button>
              </div>

              {milestone.tasks?.length > 0 && (
                <div className="ml-7 space-y-1 mb-3">
                  {milestone.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => transitionTaskMutation.mutate({
                          id: task.id,
                          status: task.status === 'PENDING' ? 'COMPLETED' : 'PENDING',
                        })}
                        className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                          task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' :
                          'border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {task.status === 'COMPLETED' && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-xs ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="ml-7 flex items-center gap-2">
                <input
                  value={newTaskTitles[milestone.id] || ''}
                  onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [milestone.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitles[milestone.id]?.trim()) {
                      addTaskMutation.mutate({ milestoneId: milestone.id, title: newTaskTitles[milestone.id].trim() });
                    }
                  }}
                  placeholder="+ Add subtask..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-primary-300"
                />
                {milestone.status !== 'COMPLETED' && milestone.status !== 'SKIPPED' && (
                  <button
                    onClick={() => transitionMilestone.mutate({ id: milestone.id, status: 'SKIPPED' })}
                    className="text-xs text-gray-300 hover:text-gray-500"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}