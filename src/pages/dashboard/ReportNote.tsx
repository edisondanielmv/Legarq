import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { 
  MessageSquare, 
  Search, 
  Send, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  FolderOpen, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Clock, 
  Sparkles,
  Hourglass,
  ArrowRight
} from 'lucide-react';
import { Procedure, ProcedureLog } from '../../types';

const COMMON_PRESETS = [
  'Revisión documental finalizada de forma exitosa.',
  'Trámite ingresado a la plataforma de la municipalidad.',
  'Inspección de campo efectuada por el área técnica.',
  'Esperando respuesta o subsanación de la entidad edil.',
  'Ficha catastral generada e ingresada para firmas.',
  'Planos visados listos, procedemos al siguiente paso.',
  'Reunión sostenida con el cliente para coordinar firmas.',
  'Expediente aprobado, a la espera del documento resolutivo.'
];

export default function ReportNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  
  const [noteText, setNoteText] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  
  const [logs, setLogs] = useState<ProcedureLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [updatingLogId, setUpdatingLogId] = useState<string | null>(null);
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch procedures on load
  const loadProcedures = async () => {
    try {
      setLoading(true);
      const data = await api.getProcedures({ 
        username: user?.username || '', 
        role: user?.role || '' 
      });
      setProcedures(data);
      
      // Auto-select first procedure if any exists
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      if (err.message === 'SETUP_REQUIRED') {
        navigate('/setup');
      } else {
        setStatusMessage({ type: 'error', text: `Error al cargar trámites: ${err.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcedures();
  }, []);

  // Fetch logs of selected procedure
  const fetchProcedureLogs = async (procId: string) => {
    if (!procId) return;
    setLoadingLogs(true);
    try {
      const logData = await api.getLogs(procId);
      // Sort logs descending by date
      const sorted = [...logData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setLogs(sorted);
    } catch (err: any) {
      console.error("Error al cargar la bitácora:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchProcedureLogs(selectedId);
    } else {
      setLogs([]);
    }
  }, [selectedId]);

  // Handle select procedure
  const selectedProcedure = procedures.find(p => p.id === selectedId);

  // Handle Preset Click
  const handleApplyPreset = (preset: string) => {
    setNoteText(prev => prev ? `${prev}\n${preset}` : preset);
  };

  // Submit Note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setStatusMessage({ type: 'error', text: 'Por favor, elija un trámite válido.' });
      return;
    }
    if (!noteText.trim()) {
      setStatusMessage({ type: 'error', text: 'El contenido de la nota no puede estar vacío.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    try {
      await api.addLog({
        procedureId: selectedId,
        technicianUsername: user?.username || '',
        note: noteText.trim(),
        isExternal: isExternal
      });

      setStatusMessage({ 
        type: 'success', 
        text: `Comentario registrado exitosamente para el trámite ${selectedProcedure?.code || ''}.` 
      });
      setNoteText('');
      
      // Refresh timeline logs automatically
      await fetchProcedureLogs(selectedId);
      
      // Fade out success message after 5 seconds
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 5000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error al guardar comentario: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter list of procedures based on search
  const filteredProcedures = procedures.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(s) ||
      (p.title || '').toLowerCase().includes(s) ||
      (p.clientName || '').toLowerCase().includes(s) ||
      (p.procedureType || '').toLowerCase().includes(s)
    );
  });

  if (loading && procedures.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Hourglass className="w-10 h-10 animate-pulse text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando trámites disponibles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Reportar Nota de Trámite</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Gestión de anotaciones y seguimiento técnico de trámites</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Procedure Finder (4 cols) - Hidden on mobile for height compactness */}
        <div className="hidden lg:flex lg:col-span-4 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex-col h-[calc(100vh-280px)] min-h-[500px]">
          <div className="mb-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-red-500" />
              Seleccionar Trámite
            </h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">
              Filtre por código, nombre o tipo
            </p>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar trámite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Procedure selection list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredProcedures.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin resultados</p>
              </div>
            ) : (
              filteredProcedures.map((proc) => {
                const isSelected = proc.id === selectedId;
                return (
                  <button
                    key={proc.id}
                    onClick={() => {
                      setSelectedId(proc.id);
                      setStatusMessage(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'border-gray-900 bg-gray-900 text-white shadow-md shadow-gray-900/10 scale-[0.99]' 
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-red-500 text-white' : 'bg-red-50 text-[#E3000F]'
                      }`}>
                        {proc.code}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        proc.status === 'Completado' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : proc.status === 'Rechazado' || proc.status === 'Inactivo'
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {proc.status}
                      </span>
                    </div>

                    <div>
                      <h4 className={`text-xs font-black truncate max-w-full ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {proc.title}
                      </h4>
                      <p className={`text-[9px] font-medium truncate ${isSelected ? 'text-stone-300' : 'text-gray-500'}`}>
                        Tipo: {proc.procedureType}
                      </p>
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between text-[9px] ${isSelected ? 'border-stone-850 text-stone-300' : 'border-gray-100 text-gray-400'}`}>
                      <span className="truncate max-w-[120px] flex items-center gap-1">
                        <User className="w-3 h-3 opacity-70" />
                        {proc.clientName}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3 bg-red-500 rounded-full h-3 text-white p-0.5 animate-bounce-horizontal" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Editor + Flow Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Action card - Reporting Form */}
          <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-gray-100 shadow-sm">
            {/* Quick selector for mobile devices */}
            {procedures.length > 0 && (
              <div className="block lg:hidden mb-4 space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#E3000F]" />
                  Seleccionar Trámite (Móvil)
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setStatusMessage(null);
                  }}
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 text-xs font-black tracking-tight transition-all cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'><path d='m6 9 6 6 6-6'/></svg>")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="" disabled>-- Elija un trámite --</option>
                  {procedures.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title} - {p.clientName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProcedure ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Selected procedure info summary */}
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-sans">Trámite Seleccionado</span>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#E3000F]" />
                      [{selectedProcedure.code}] {selectedProcedure.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Propietario: {selectedProcedure.clientName} ({selectedProcedure.idNumber}) | Correo: {selectedProcedure.clientEmail || 'No registrado'}
                    </p>
                  </div>
                  
                  {selectedProcedure.driveUrl && (
                    <a 
                      href={selectedProcedure.driveUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 px-3 py-1.5 self-start sm:self-center text-[9px] font-black uppercase tracking-widest text-[#E3000F] hover:text-[#B30009] bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-xl transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Carpeta Drive
                      <ExternalLink className="w-2.5 h-2.5 opacity-65" />
                    </a>
                  )}
                </div>

                {/* Text editor and layout */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Contenido de la Nota
                  </label>
                  <p className="text-[9px] text-gray-400 font-medium tracking-wide">
                    Redacte de forma clara los avances actuales o anotaciones para registrar en el historial.
                  </p>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Escriba aquí los detalles correspondientes..."
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all font-sans"
                  />
                </div>

                {/* Controls and submission */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-gray-100 gap-4">
                  {/* Visibility Toggler */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsExternal(prev => !prev)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isExternal ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Comentario externo</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isExternal ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {isExternal ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider block">
                          {isExternal ? 'Visible al Cliente' : 'Nota Solo Interna'}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold block uppercase tracking-wide">
                          {isExternal ? 'El propietario del trámite podrá consultar esta nota estatal.' : 'Solo personal autorizado verá esta anotación.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 bg-[#E3000F] text-white border border-[#E3000F] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 hover:border-red-700 disabled:opacity-55 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/15"
                  >
                    <Send className={`w-3.5 h-3.5 ${submitting ? 'animate-bounce' : ''}`} />
                    {submitting ? 'Registrando...' : 'Registrar Nota'}
                  </button>
                </div>

                {/* Status messages */}
                {statusMessage && (
                  <div className={`mt-4 p-4 rounded-xl border flex items-start gap-2.5 animate-fadeIn ${
                    statusMessage.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-[10px] sm:text-xs font-bold leading-normal">
                      {statusMessage.text}
                    </span>
                  </div>
                )}

              </form>
            ) : (
              <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Ningún trámite seleccionado</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-sm mx-auto">
                  Por favor, elija un trámite en el panel de la izquierda para poder escribir reportes y notas.
                </p>
              </div>
            )}
          </div>

          {/* Historical timeline of log entries for the selected procedure */}
          {selectedId && (
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#C5B39A]" />
                  Historial de Notas del Trámite
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  {logs.length} {logs.length === 1 ? 'Nota' : 'Notas'} escritas
                </span>
              </h3>

              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Clock className="w-6 h-6 animate-spin text-[#E3000F]" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cargando bitácora...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/30 rounded-2xl border border-gray-100">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aún no se registran notas de bitácora en este trámite.</p>
                </div>
              ) : (
                <div className="flow-root pl-2">
                  <ul className="-mb-8">
                    {logs.map((log, index) => {
                      const isLogExternal = String(log.isExternal) === 'true' || log.isExternal === true;
                      return (
                        <li key={log.id || index}>
                          <div className="relative pb-8">
                            {index !== logs.length - 1 ? (
                              <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-150" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                              {/* Icon background based on visibility */}
                              <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm ${
                                isLogExternal 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                  : 'bg-rose-50 border-rose-100 text-rose-600'
                              }`}>
                                {isLogExternal ? (
                                  <Unlock className="w-4 h-4" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider block">
                                      {log.technicianUsername ? `Técnico: ${log.technicianUsername}` : 'Personal Legarq'}
                                    </span>
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1 rounded-full select-none transition-all">
                                      <input 
                                        type="checkbox" 
                                        checked={isLogExternal} 
                                        disabled={updatingLogId === log.id}
                                        onChange={async (e) => {
                                          if (!log.id) return;
                                          const checked = e.target.checked;
                                          setUpdatingLogId(log.id);
                                          try {
                                            await api.updateLog({
                                              id: log.id,
                                              note: log.note,
                                              isExternal: checked
                                            });
                                            setLogs(prev => prev.map(l => l.id === log.id ? { ...l, isExternal: checked } : l));
                                          } catch (err: any) {
                                            console.error("Error al actualizar visibilidad:", err);
                                          } finally {
                                            setUpdatingLogId(null);
                                          }
                                        }}
                                        className="w-3 h-3 text-[#E3000F] rounded border-gray-300 cursor-pointer focus:ring-[#E3000F]"
                                      />
                                      <span className={`text-[8px] font-black uppercase tracking-wide flex items-center gap-1 ${
                                        isLogExternal ? 'text-emerald-700' : 'text-rose-600'
                                      }`}>
                                        {isLogExternal ? 'Público (Cliente)' : 'Solo Interno'}
                                        {updatingLogId === log.id && (
                                          <span className="w-2 h-2 border-2 border-dashed border-current rounded-full animate-spin inline-block"></span>
                                        )}
                                      </span>
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    {log.date ? new Date(log.date).toLocaleString('es-PE', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Sin fecha'}
                                  </div>
                                </div>
                                <div className="mt-2 text-xs font-medium text-gray-700 leading-relaxed bg-gray-50/50 hover:bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                  <p className="whitespace-pre-line">{log.note}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
