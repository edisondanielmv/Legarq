import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Guardando cambios...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Animated Hourglass SVG */}
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E3000F" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
            
            <g className="animate-[spin_4s_linear_infinite] origin-center">
              {/* Top half */}
              <path d="M50 40 L150 40 L105 95 Q100 100 95 95 L50 40" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
              {/* Bottom half */}
              <path d="M50 160 L150 160 L105 105 Q100 100 95 105 L50 160" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
              
              {/* Sand Top */}
              <path className="animate-[pulse_2s_ease-in-out_infinite]" d="M65 60 L135 60 L100 95 Z" fill="url(#sandGrad)" opacity="0.8" />
              
              {/* Sand Bottom */}
              <path className="animate-[pulse_2s_ease-in-out_infinite]" d="M100 105 L135 145 L65 145 Z" fill="url(#sandGrad)" opacity="0.8" />
              
              {/* Center Connection */}
              <rect x="98" y="95" width="4" height="10" fill="url(#sandGrad)" className="animate-pulse" />
            </g>
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-gray-900 uppercase tracking-widest">{message}</p>
          <p className="text-xs font-bold text-gray-500">Por favor espere un momento...</p>
        </div>
      </div>
    </div>
  );
}
