'use client';

import { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
      setMessage(`Document submitted! Job ID: ${res.data.job.id}`);
      setFile(null);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all hover:border-gray-300 bg-gray-50/50 relative">
      <input
        type="file"
        accept="application/pdf"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {status === 'success' ? (
        <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
      ) : status === 'error' ? (
        <XCircle className="w-10 h-10 text-red-500 mb-3" />
      ) : (
        <FileText className="w-10 h-10 text-gray-400 mb-3" />
      )}
      
      <p className="text-sm font-medium text-gray-900 mb-1">
        {file ? file.name : 'Drag and drop your PDF here, or click to browse'}
      </p>
      {message && (
        <p className={`text-xs mt-2 font-medium ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      {file && status !== 'success' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={uploading}
          className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center shadow-sm relative z-10"
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      )}
    </div>
  );
}
