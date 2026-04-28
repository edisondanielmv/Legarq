import React, { useState } from 'react';
import { Settings, Database, RefreshCw, Copy, CheckCircle2, Code, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { BACKEND_SCRIPT } from '../../constants/backendCode';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function SettingsPage() {
  const [initializing, setInitializing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState<{ success: boolean, msg: string } | null>(null);

  const handleInitDB = async () => {
    console.log("handleInitDB clicked");
    if (typeof api.setupDatabase !== 'function') {
      console.error("api.setupDatabase is not a function!");
      setResults({ success: false, msg: 'Error: La función de inicialización no está disponible.' });
      return;
    }
    setInitializing(true);
    setResults(null);
    try {
      console.log("Calling api.setupDatabase...");
      const response = await api.setupDatabase();
      console.log("API Success:", response);
      setResults({ success: true, msg: 'Tablas inicializadas y actualizadas correctamente.' });
    } catch (error: any) {
      console.error("API Error:", error);
      setResults({ success: false, msg: error.message || 'Error al conectar con Google Sheets.' });
    } finally {
      setInitializing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(BACKEND_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans selection:bg-[#E3000F] selection:text-white pb-20">
      {initializing && <LoadingOverlay message="Inicializando base de datos..." />}

      <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-50 rounded-2xl">
            <Settings className="w-6 h-6 text-[#E3000F]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Configuración del Sistema</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Mantenimiento y base de datos</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DB Maintenance */}
          <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
                <Database className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">Mantenimiento de Tablas</h3>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed mb-6">
                Use esta opción para forzar la creación de columnas nuevas en su Google Sheet si ha realizado actualizaciones recientes en el sistema o si nota fallos al guardar tramites.
              </p>
            </div>
            
            <button 
              type="button"
              onClick={handleInitDB}
              disabled={initializing}
              className="w-full h-11 bg-white text-gray-900 border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${initializing ? 'animate-spin' : ''}`} />
              {initializing ? 'Procesando...' : 'Inicializar Tablas'}
            </button>
          </div>

          {/* Backend Code */}
          <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
                <Code className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">Código Backend (Apps Script)</h3>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed mb-6">
                Si ha actualizado el sistema, es posible que deba actualizar el código en su Google Sheets (Herramientas &gt; Apps Script).
              </p>
            </div>
            
            <button 
              onClick={copyCode}
              className="w-full h-11 bg-white text-gray-900 border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Código App Script'}
            </button>
          </div>
        </div>

        {results && (
          <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest ${results.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {results.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {results.msg}
          </div>
        )}
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-4 text-amber-700">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight">Atención: Actualización de Estructura</h4>
          <p className="text-[10px] font-medium leading-relaxed mt-1">
            Se ha añadido la nueva columna <strong>"Numero de Plataforma"</strong>. Si el botón de "Inicializar Tablas" no funciona, debe ir a su Google Sheet y agregar manualmente una columna llamada <strong>platformNumber</strong> (respetando mayúsculas/minúsculas) al final de la hoja <strong>"Tramites"</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
