import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans selection:bg-[#E3000F] selection:text-white">
      <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-xl">
            <Settings className="w-5 h-5 text-[#E3000F]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Configuración General</h2>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Ajustes del sistema y preferencias</p>
          </div>
        </div>
        
        <div className="py-12 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No hay configuraciones adicionales disponibles en este momento.</p>
        </div>
      </div>
    </div>
  );
}
