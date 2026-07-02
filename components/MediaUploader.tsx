'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MediaUploaderProps {
  jobCardId: string;
  onUploadComplete?: () => void;
}

export default function MediaUploader({ jobCardId, onUploadComplete }: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/media/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', jobCardId] });
      toast.success('Files uploaded!');
      setFiles([]);
      setTags([]);
      onUploadComplete?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Upload failed');
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('jobCardId', jobCardId);
    formData.append('category', 'image');
    formData.append('tags', JSON.stringify(tags.length > 0 ? tags : ['general']));
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          id="media-upload"
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF (max 50MB each)</p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {files.map((f, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button onClick={addTag} className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700">
              + Add
            </button>
            {tags.length > 0 && (
              <div className="flex gap-1.5">
                {tags.map(t => (
                  <span key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? `Uploading ${files.length} file(s)...` : `Upload ${files.length} file(s)`}
          </button>
        </div>
      )}
    </div>
  );
}