import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = "Processing Image..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-600 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default Loader;