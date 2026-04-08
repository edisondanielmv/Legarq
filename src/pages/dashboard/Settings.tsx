import React, { useState } from 'react';
import { Copy, Check, Code, AlertTriangle, ExternalLink } from 'lucide-react';
import appsScriptCode from '../../../APPS_SCRIPT.js?raw';

export default function Settings() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-red-50 rounded-xl">
            <Code className="w-5 h-5 md:w-6 md:h-6 text-[#E3000F]" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-stone-900 uppercase tracking-tight">Configuración de Backend</h2>
            <p className="text-stone-500 text-[10px] md:text-sm">Código de Google Apps Script para sincronización.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex gap-3 md:gap-4">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0" />
          <div className="text-[10px] md:text-sm text-amber-800">
            <p className="font-bold mb-1">¡Atención Administrador!</p>
            <p>Este código es esencial para el funcionamiento del sistema. Si realizas cambios en la estructura de la aplicación, debes actualizar el script en Google Apps Script:</p>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Copia el código completo.</li>
              <li>Ve a tu proyecto de Google Apps Script.</li>
              <li>Borra todo el código anterior y pega el nuevo.</li>
              <li>Guarda e implementa como Aplicación Web.</li>
            </ol>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  <span className="text-[10px] md:text-xs font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs font-bold">Copiar</span>
                </>
              )}
            </button>
            <a 
              href="https://script.google.com/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-stone-200 text-stone-900 rounded-lg hover:bg-stone-50 transition-all shadow-sm"
            >
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-xs font-bold">Abrir</span>
            </a>
          </div>
          
          <div className="bg-stone-950 rounded-xl p-4 md:p-6 overflow-hidden border border-stone-800">
            <pre className="text-stone-300 text-[10px] md:text-[13px] font-mono overflow-x-auto max-h-[400px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent pt-10 md:pt-12">
              {appsScriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
