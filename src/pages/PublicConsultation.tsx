import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, Circle, Building2, ArrowRight, Info, FileText, Calendar, MapPin, Hash, ExternalLink, Home, User, Phone, MessageSquare, ChevronDown, ChevronUp, Eye, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Procedure, ProcedureType } from '../types';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

const PublicConsultation = () => {
  const { user: loggedUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [procedures, setProcedures] = useState<Procedure[] | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [error, setError] = useState('');
  const [expandedProcedures, setExpandedProcedures] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProcedures(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  useEffect(() => {
    const queryId = searchParams.get('idNumber');
    if (queryId) {
      setIdNumber(queryId);
      const performSearch = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await api.getProcedureByClientId(queryId);
          setProcedures(data.procedures);
          setClient(data.client);
        } catch (err: any) {
          setError(err.message || 'No se encontraron trámites para esta cédula.');
        } finally {
          setLoading(false);
        }
      };
      performSearch();
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = idNumber.trim();
    if (!trimmedId) return;

    setLoading(true);
    setError('');
    setProcedures(null);
    setClient(null);

    try {
      const data = await api.getProcedureByClientId(trimmedId);
      setProcedures(data.procedures);
      setClient(data.client);
    } catch (err: any) {
      setError(err.message || 'No se encontraron trámites para esta cédula.');
    } finally {
      setLoading(false);
    }
  };

  const getStepsForProcedure = (proc: Procedure) => {
    const currentType = procedureTypes.find(t => t.name === proc.procedureType);
    if (!currentType?.steps) return [];
    try {
      // Handle both JSON string and already parsed array (just in case)
      const steps = typeof currentType.steps === 'string' ? JSON.parse(currentType.steps) : currentType.steps;
      return Array.isArray(steps) ? steps : [];
    } catch (e) {
      console.error('Error parsing steps for procedure type:', currentType.name, e);
      // Fallback: if it's a comma-separated string but not JSON
      if (typeof currentType.steps === 'string') {
        return currentType.steps.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    }
  };

  const getProgress = (proc: Procedure) => {
    const steps = getStepsForProcedure(proc);
    if (!steps.length) return 0;
    if (!proc.completedSteps) return 0;
    
    // Ensure completedSteps is treated as a string
    const completedStr = String(proc.completedSteps);
    const completed = completedStr.split(',').filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-[#E3000F] selection:text-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-2 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
              alt="LEGARQ" 
              className="h-12 w-auto group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </Link>
          <div className="flex items-center gap-4">
            {loggedUser && (
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-gray-50 text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Regresar al Panel
              </button>
            )}
            <Link to="/login" className="text-[10px] font-bold text-gray-500 hover:text-[#E3000F] transition-colors uppercase tracking-widest">
              Acceso
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 md:py-10 px-4 md:px-6">
        {/* Search Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto mb-8 md:mb-12"
        >
          <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 p-2 md:p-3">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cédula de identidad"
                  className="w-full pl-11 pr-4 py-3.5 md:py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white outline-none transition-all text-sm font-black text-gray-900 placeholder:text-gray-300 border"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1A1A1A] hover:bg-[#E3000F] text-white px-8 py-3.5 md:py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Consultar <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100"
            >
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {procedures && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {procedures.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-100"
                >
                  <div className="bg-gray-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Sin resultados</h3>
                  <p className="text-gray-400 max-w-xs mx-auto text-[10px] font-black uppercase tracking-widest leading-relaxed">No encontramos trámites asociados a esta cédula.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {procedures.map((proc, idx) => {
                    const progress = getProgress(proc);
                    const steps = getStepsForProcedure(proc);
                    const completedStr = proc.completedSteps ? String(proc.completedSteps) : '';
                    const completedIndices = completedStr.split(',').filter(Boolean).map(Number);
                    const isExpanded = expandedProcedures[proc.id];
                    
                    return (
                      <motion.div 
                        key={proc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden group hover:border-[#E3000F]/20 transition-all hover:shadow-xl hover:shadow-gray-200/50"
                      >
                        <div className="p-6 md:p-8">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className={clsx(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                  proc.status === 'Finalizado' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  proc.status === 'En proceso' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  "bg-gray-50 text-gray-600 border-gray-100"
                                )}>
                                  {proc.status}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5" /> {proc.code}
                                </span>
                              </div>
                              <h2 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-[#E3000F] transition-colors leading-tight">
                                {proc.title}
                              </h2>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  {new Date(proc.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => toggleExpand(proc.id)}
                              className="flex items-center gap-3 bg-[#1A1A1A] text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E3000F] transition-all active:scale-95 shadow-xl shadow-gray-200"
                            >
                              {isExpanded ? (
                                <><ChevronUp className="w-4 h-4" /></>
                              ) : (
                                <><ChevronDown className="w-4 h-4" /></>
                              )}
                              {isExpanded ? 'Cerrar' : 'Ver Detalle'}
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="pt-8 mt-8 border-t border-gray-50">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2">
                                      {/* Progress Bar */}
                                      <div className="mb-8">
                                        <div className="flex justify-between items-end mb-3">
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Progreso del Trámite</span>
                                          <span className="text-2xl font-black text-gray-900">{progress}%</span>
                                        </div>
                                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden border border-white shadow-inner">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "circOut" }}
                                            className={clsx(
                                              "h-full rounded-full relative",
                                              progress === 100 ? "bg-emerald-500" : "bg-[#E3000F]"
                                            )}
                                          />
                                        </div>
                                      </div>

                                      {/* Steps List */}
                                      {steps.length > 0 && (
                                        <div className="bg-gray-50/50 rounded-[24px] p-6 md:p-8 border border-gray-100">
                                          <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <div className="w-4 h-1 bg-[#E3000F] rounded-full" />
                                            Hoja de Ruta
                                          </h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {steps.map((step: string, index: number) => {
                                              const isCompleted = completedIndices.includes(index);
                                              return (
                                                <div key={index} className="flex items-start gap-3 group/step">
                                                  <div className={clsx(
                                                    "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all",
                                                    isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white text-gray-200 border border-gray-100"
                                                  )}>
                                                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                                  </div>
                                                  <span className={clsx(
                                                    "text-[11px] font-black uppercase tracking-tight leading-tight pt-0.5 transition-colors",
                                                    isCompleted ? "text-gray-900" : "text-gray-400"
                                                  )}>
                                                    {step}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-6">
                                      {/* External Logs (Bitácora) */}
                                      {proc.logs && proc.logs.length > 0 && (
                                        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                                          <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <MessageSquare className="w-4 h-4 text-[#E3000F]" />
                                            Bitácora
                                          </h3>
                                          <div className="space-y-6">
                                            {proc.logs.filter(l => l.isExternal).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                                              <div key={log.id} className="relative pl-5 pb-6 last:pb-0 border-l-2 border-gray-50 last:border-l-0">
                                                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#E3000F] shadow-lg shadow-red-200" />
                                                <div className="flex flex-col gap-1.5">
                                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {new Date(log.date).toLocaleDateString()}
                                                  </span>
                                                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                                                    {log.note}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto py-12 px-6">
        <div className="w-12 h-1 bg-gray-100 mx-auto mb-10 rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-center md:text-left">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Ubicación</h4>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Quito, Cayambe - Ecuador</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Contacto Directo</h4>
            <a href="mailto:info@legarqconstructora.com" className="text-[11px] font-bold text-[#E3000F] uppercase tracking-tight block hover:underline">info@legarqconstructora.com</a>
            <div className="flex flex-col items-center md:items-start gap-1">
              <a href="https://wa.me/593984663791" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-gray-900 hover:text-[#E3000F] transition-colors">0984663791</a>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> WhatsApp Disponible
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Horario</h4>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Lunes a Viernes: 08:30 - 17:30</p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-300 text-[9px] font-black uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Legarq Constructora
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="text-[9px] font-black text-gray-300 hover:text-gray-900 uppercase tracking-widest transition-colors">Acceso Sistema</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicConsultation;
