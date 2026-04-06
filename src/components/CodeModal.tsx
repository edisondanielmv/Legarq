import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import appsScriptCode from '../../APPS_SCRIPT.js?raw';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeModal({ isOpen, onClose }: CodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-[#E3000F]" />
            Código de Google Apps Script
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-md hover:bg-[#E3000F] transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-amber-50 border-b border-amber-100 text-sm text-amber-800">
          <p className="font-bold mb-1">⚠️ IMPORTANTE: Cómo solucionar el error de permisos</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Copia este código y pégalo en tu editor de Apps Script.</li>
            <li>Selecciona la función <strong>setup</strong> en la barra superior y haz clic en <strong>Ejecutar</strong>.</li>
            <li>Autoriza los permisos (Avanzado &gt; Ir a proyecto &gt; Permitir).</li>
            <li><strong>CRÍTICO:</strong> Ve a <strong>Implementar &gt; Nueva implementación</strong> (o Gestionar implementaciones &gt; Editar &gt; Nueva versión).</li>
            <li>Si no creas una <strong>Nueva versión</strong> de la implementación, la aplicación web seguirá usando el código viejo sin permisos.</li>
          </ol>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {appsScriptCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
