import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, APPS_SCRIPT_URL } from '../lib/api';
import { Lock, User as UserIcon, Loader2, Code, Copy, Check } from 'lucide-react';
import appsScriptCode from '../../APPS_SCRIPT.js?raw';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await apiCall('login', { username, password });
      login(userData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDemo = !APPS_SCRIPT_URL;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Botón flotante para ver el código */}
      <button
        onClick={() => setShowCodeModal(true)}
        className="absolute top-4 right-4 flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-3 py-1.5 md:px-4 md:py-2 rounded-md text-[10px] md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Code className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden xs:inline">Código Apps Script</span>
        <span className="xs:hidden">Código</span>
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          LEG<span className="text-[#E3000F]">AR</span>Q
        </h2>
        <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
          Sistema de Gestión de Trámites
        </p>
      </div>

      <div className="mt-6 md:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isDemo && (
          <div className="mb-4 bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-lg text-[10px] md:text-sm text-amber-800">
            <p className="font-bold mb-1">Modo Demostración Activo</p>
            <p>La base de datos de Google Sheets no está conectada. Puede probar el sistema con:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Admin: <strong>admin</strong> / admin</li>
            </ul>
            <Link to="/setup" className="mt-2 inline-block font-bold text-[#E3000F] hover:underline">
              Configurar Google Sheets →
            </Link>
          </div>
        )}
        <div className="bg-white py-6 md:py-8 px-4 md:px-10 shadow-sm border border-gray-100 rounded-2xl">
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 md:px-4 md:py-3 rounded-md text-[10px] md:text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                Nombre de Usuario
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 md:pl-10 border-gray-300 rounded-lg focus:ring-[#E3000F] focus:border-[#E3000F] text-xs md:text-sm py-2 md:py-2.5 border outline-none"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 md:pl-10 border-gray-300 rounded-lg focus:ring-[#E3000F] focus:border-[#E3000F] text-xs md:text-sm py-2 md:py-2.5 border outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 md:py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-red-100 text-xs md:text-sm font-bold text-white bg-[#1A1A1A] hover:bg-[#E3000F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E3000F] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] md:text-sm text-gray-500 mb-2">¿Desea consultar el estado de su trámite?</p>
            <Link 
              to="/consulta" 
              className="inline-flex items-center gap-2 text-[#E3000F] font-black hover:underline text-xs md:text-sm uppercase tracking-wider"
            >
              Consultar con Cédula
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Código Apps Script */}
      {showCodeModal && (
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
                  onClick={() => setShowCodeModal(false)}
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
      )}
    </div>
  );
}
