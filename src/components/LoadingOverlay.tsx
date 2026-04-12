import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Guardando cambios...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Animated Architect SVG */}
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
            </defs>
            
            <circle cx="100" cy="100" r="90" fill="url(#bg)" />
            
            <g className="animate-[bounce_2s_ease-in-out_infinite]">
              {/* Body */}
              <path d="M60 180 Q60 130 100 130 Q140 130 140 180" fill="#334155" />
              <path d="M80 180 L80 140 L120 140 L120 180" fill="#cbd5e1" />
              
              {/* Head */}
              <circle cx="100" cy="100" r="25" fill="#fcd34d" />
              
              {/* Hard Hat */}
              <path d="M70 95 Q100 60 130 95 L135 95 L135 105 L65 105 L65 95 Z" fill="#fbbf24" />
              <rect x="60" y="100" width="80" height="5" rx="2" fill="#f59e0b" />
              
              {/* Face Details */}
              <circle cx="90" cy="95" r="3" fill="#1e293b" />
              <circle cx="110" cy="95" r="3" fill="#1e293b" />
              <path d="M95 105 Q100 110 105 105" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
              
              {/* Blueprint Roll (Animated) */}
              <g className="animate-[pulse_2s_ease-in-out_infinite]" transform="translate(0, 5)">
                <rect x="50" y="120" width="100" height="20" rx="4" fill="#3b82f6" transform="rotate(-15 100 130)" />
                <rect x="55" y="125" width="90" height="10" rx="2" fill="#60a5fa" transform="rotate(-15 100 130)" />
                <line x1="60" y1="130" x2="140" y2="130" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="4 4" transform="rotate(-15 100 130)" />
                <circle cx="50" cy="120" r="10" fill="#2563eb" transform="rotate(-15 100 130)" />
                <circle cx="150" cy="120" r="10" fill="#2563eb" transform="rotate(-15 100 130)" />
              </g>
            </g>
            
            {/* Sparkles */}
            <g className="animate-[spin_4s_linear_infinite] origin-center">
              <path d="M40 60 L45 50 L50 60 L40 60" fill="#fbbf24" />
              <path d="M160 80 L165 70 L170 80 L160 80" fill="#fbbf24" />
              <path d="M140 150 L145 140 L150 150 L140 150" fill="#fbbf24" />
            </g>
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-gray-900 uppercase tracking-widest">{message}</p>
          <p className="text-xs font-bold text-gray-500">Nuestros arquitectos están trabajando en ello...</p>
        </div>
      </div>
    </div>
  );
}
