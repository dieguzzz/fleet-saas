'use client';

import { useEffect, useState } from 'react';
import { checkDatabaseConnection } from '@/features/debug/actions';

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    checkDatabaseConnection().then((result) => {
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);
      setLatency(result.duration);
    });
  }, []);

  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs flex items-center gap-2 z-50">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        Checking DB Connection...
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg text-xs flex flex-col gap-1 max-w-xs border z-50 transition-all duration-500 ${
      status === 'success'
        ? 'bg-green-900/90 text-green-100 border-green-700'
        : 'bg-red-900/90 text-red-100 border-red-700'
    }`}>
      <div className="flex items-center gap-2 font-semibold">
        <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
        {status === 'success' ? 'Database Connected' : 'Connection Failed'}
      </div>
      <p className="opacity-90">{message}</p>
      {status === 'success' && (
        <p className="opacity-70 text-[10px]">Latency: {latency}ms</p>
      )}
    </div>
  );
}
