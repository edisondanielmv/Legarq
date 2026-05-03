import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Guardando cambios...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white px-6 py-5 rounded-[24px] shadow-2xl shadow-black/10 flex items-center gap-4 border border-gray-100">
        <div className="w-12 h-12 rounded-[16px] bg-red-50 flex items-center justify-center shrink-0">
          <Loader2 className="w-6 h-6 text-[#E3000F] animate-spin" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{message}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Por favor espere un momento...</p>
        </div>
      </div>
    </div>
  );
}
