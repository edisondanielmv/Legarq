import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, Circle, Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { Procedure, ProcedureType } from '../types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const PublicConsultation = () => {
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [procedures, setProcedures] = useState<Procedure[] | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await api.getProcedureTypes();
        setProcedureTypes(types);
      } catch (err) {
        console.error('Error fetching procedure types:', err);
      }
    };
    fetchTypes();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber) return;

    setLoading(true);
    setError('');
    setProcedures(null);

    try {
      const data = await api.getProcedureByClientId(idNumber);
      setProcedures(data);
    } catch (err: any) {
      setError(err.message || 'No se encontraron trámites para esta cédula.');
    } finally {
      setLoading(false);
    }
  };

  const getStepsForProcedure = (proc: Procedure) => {
    const currentType = procedureTypes.find(t => t.name === proc.procedureType);
    return currentType?.steps ? JSON.parse(currentType.steps) : [];
  };

  const getProgress = (proc: Procedure) => {
    if (!proc.completedSteps) return 0;
    const steps = getStepsForProcedure(proc);
    const completed = proc.completedSteps.split(',').filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#E3000F]" />
            <span className="text-xl font-bold tracking-tight text-stone-900">LEGARQ</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-stone-600 hover:text-orange-600 transition-colors">
            Acceso Personal
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-stone-900 mb-2 md:mb-4 tracking-tight">Consulta de Trámites</h1>
          <p className="text-xs md:text-base text-stone-600 max-w-lg mx-auto">
            Ingresa tu número de cédula para conocer el estado actual y avance de tus procesos.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 md:p-8 mb-6 md:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Número de Cédula"
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm md:text-lg"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm md:text-lg shadow-lg shadow-orange-600/20"
            >
              {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : 'Consultar'}
            </button>
          </form>
          {error && <p className="mt-3 text-red-600 text-[10px] md:text-sm font-medium">{error}</p>}
        </div>

        {/* Results */}
        {procedures && (
          <div className="space-y-4 md:space-y-6">
            {procedures.length === 0 ? (
              <div className="text-center py-8 md:py-12 bg-white rounded-2xl border border-stone-200">
                <p className="text-xs md:text-base text-stone-500">No tienes trámites registrados actualmente.</p>
              </div>
            ) : (
              procedures.map((proc) => {
                const progress = getProgress(proc);
                const steps = getStepsForProcedure(proc);
                const completedIndices = proc.completedSteps ? proc.completedSteps.split(',').map(Number) : [];
                
                return (
                  <div key={proc.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    {steps.length > 0 && (
                      <>
                        <div className="p-4 md:p-8 border-b border-stone-100">
                          <div className="flex justify-between items-start mb-4 md:mb-6">
                            <div>
                              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1 block">
                                {proc.status}
                              </span>
                              <h2 className="text-lg md:text-2xl font-bold text-stone-900 tracking-tight">{proc.title}</h2>
                            </div>
                            <div className="text-right">
                              <span className={clsx(
                                "text-2xl md:text-4xl font-black",
                                progress <= 33 ? "text-[#E3000F]" : 
                                progress <= 66 ? "text-stone-500" : "text-stone-900"
                              )}>{progress}%</span>
                              <span className="block text-[8px] md:text-xs font-medium text-stone-400 uppercase tracking-wider">Avance</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-stone-100 h-2 md:h-4 rounded-full overflow-hidden mb-3 md:mb-4 border border-stone-200">
                            <div 
                              className={clsx(
                                "h-full transition-all duration-1000 ease-out",
                                progress <= 33 ? "bg-[#E3000F]" : 
                                progress <= 66 ? "bg-stone-400" : "bg-stone-900"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-stone-600 text-[10px] md:text-sm leading-relaxed">{proc.description}</p>
                        </div>

                        {/* Steps Checklist (Visual Only for Client) */}
                        <div className="bg-stone-50 p-4 md:p-8">
                          <h3 className="text-[10px] md:text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 md:mb-6">Estado del Proceso</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                            {steps.map((step: string, index: number) => {
                              const isCompleted = completedIndices.includes(index);
                              return (
                                <div key={index} className="flex items-center gap-2 md:gap-3">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 md:w-5 md:h-5 text-stone-300 shrink-0" />
                                  )}
                                  <span className={`text-[10px] md:text-sm ${isCompleted ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto py-12 px-6 border-t border-stone-200 text-center">
        <p className="text-stone-400 text-sm">
          © {new Date().getFullYear()} Legarq Constructora. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default PublicConsultation;
