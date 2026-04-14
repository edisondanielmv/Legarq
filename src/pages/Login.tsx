import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, APPS_SCRIPT_URL } from '../lib/api';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const isDemo = !APPS_SCRIPT_URL;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
            alt="LEGARQ" 
            className="h-20 w-auto"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="mt-4 text-xs md:text-sm text-gray-600 font-medium">
          Sistema de Gestión de Trámites
        </p>
      </div>

      <div className="mt-6 md:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isDemo && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-[24px] text-[10px] md:text-sm text-amber-800 shadow-sm">
            <p className="font-black uppercase tracking-widest mb-1">Modo Demostración Activo</p>
            <p className="font-medium">La base de datos de Google Sheets no está conectada. Puede probar el sistema con:</p>
            <ul className="list-disc ml-5 mt-2 font-bold">
              <li>Admin: <span className="text-[#E3000F]">admin</span> / admin</li>
            </ul>
          </div>
        )}
        <div className="bg-white py-8 md:py-12 px-6 md:px-12 shadow-2xl shadow-gray-200 border border-gray-100 rounded-[40px]">
          <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-[#E3000F] focus:bg-white text-sm font-bold outline-none transition-all border"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-300" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-[#E3000F] focus:bg-white text-sm font-bold outline-none transition-all border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-red-900/20 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white bg-[#1A1A1A] hover:bg-[#E3000F] focus:outline-none transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">¿Desea consultar su trámite?</p>
            <Link 
              to="/consulta" 
              className="inline-flex items-center gap-2 text-[#E3000F] font-black hover:text-red-700 text-xs md:text-sm uppercase tracking-[0.15em] transition-colors"
            >
              Consultar con Cédula
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
