import { Link } from 'react-router-dom';
import { Database, Copy, CheckCircle, Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiCall } from '../lib/api';
import { BACKEND_SCRIPT } from '../constants/backendCode';
import clsx from 'clsx';

export default function Setup() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(BACKEND_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiCall('ping') as any;
      if (res && res.status === 'ok') {
        setTestResult({ success: true, message: '¡Conexión exitosa! La base de datos está lista.' });
      } else {
        throw new Error();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Error: No se pudo conectar. Verifique la URL y que el script esté publicado como "Cualquier persona".' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Database className="mx-auto h-12 w-12 text-[#E3000F]" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Configuración de Base de Datos
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Siga estos pasos para conectar la aplicación con Google Sheets.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Step 1 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">1</span>
                Crear Hoja de Cálculo
              </h3>
              <p className="text-gray-600 ml-11">
                Vaya a <a href="https://sheets.google.com/create" target="_blank" rel="noreferrer" className="text-[#E3000F] hover:underline">Google Sheets</a> y cree un documento en blanco.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">2</span>
                Configurar Apps Script
              </h3>
              <div className="ml-11 text-gray-600 space-y-4">
                <p>1. En su hoja de cálculo, vaya a <strong>Extensiones</strong> {'>'} <strong>Apps Script</strong>.</p>
                <p>2. Borre todo el código existente en el editor y pegue el siguiente bloque:</p>
                
                <div className="relative group">
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      onClick={handleCopy}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                        copied ? "bg-green-500 text-white" : "bg-white/90 text-gray-700 hover:bg-white shadow-sm border border-gray-200"
                      )}
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-6 overflow-hidden border border-gray-800 shadow-inner">
                    <pre className="text-gray-300 text-[10px] md:text-xs font-mono overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-700">
                      {BACKEND_SCRIPT}
                    </pre>
                  </div>
                </div>

                <p>3. Haga clic en el ícono de disco (Guardar) y póngale un nombre (ej: "Backend LEGARQ").</p>
                <p>4. <strong>IMPORTANTE:</strong> Haga clic en <strong>Ejecutar</strong> y seleccione la función <code>setup</code>. Deberá otorgar permisos de Google Sheets y Drive en la ventana emergente.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">3</span>
                Autorizar y Publicar
              </h3>
              <div className="ml-11 text-gray-600 space-y-4">
                <p>1. Haga clic en el botón azul <strong>Implementar</strong> (arriba a la derecha) y seleccione <strong>Nueva implementación</strong>.</p>
                <p>2. Haga clic en el ícono de engranaje junto a "Seleccionar tipo" y elija <strong>Aplicación web</strong>.</p>
                <p>3. En "Ejecutar como", seleccione <strong>Yo</strong>.</p>
                <p>4. En "Quién tiene acceso", seleccione <strong>Cualquier persona</strong>.</p>
                <p>5. Haga clic en <strong>Implementar</strong> y copie la <strong>URL de la aplicación web</strong>.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-sm">4</span>
                Configurar la Variable de Entorno
              </h3>
              <div className="ml-11 text-gray-600 space-y-4">
                <p>
                  Vuelva a AI Studio, haga clic en el ícono de engranaje (<Settings className="inline w-4 h-4" />) en la esquina superior derecha para abrir <strong>Settings</strong>.
                </p>
                <p>
                  Vaya a <strong>Secrets</strong>, escriba <code>VITE_APPS_SCRIPT_URL</code> y pegue la URL que copió en el paso anterior.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                  <p className="text-blue-800 font-medium">Una vez configurado, pruebe la conexión:</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={handleTest}
                      disabled={testing}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                      Probar Conexión
                    </button>
                    {testResult && (
                      <div className={clsx("p-3 rounded-md text-sm", testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <Link to="/login" className="inline-flex justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1A1A1A] hover:bg-[#E3000F] transition-colors">
                    Ir al Login
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
