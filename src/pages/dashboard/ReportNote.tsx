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
  ArrowRight,
  Upload,
  Image,
  Trash2,
  Pencil,
  X,
  Check
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
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  
  const [logs, setLogs] = useState<ProcedureLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [updatingLogId, setUpdatingLogId] = useState<string | null>(null);
  
  // States for editing and deleting notes
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogText, setEditingLogText] = useState<string>('');
  const [editingIsExternal, setEditingIsExternal] = useState<boolean>(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for Municipal Observations Image
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [attachedImageName, setAttachedImageName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    setUploadingImage(true);
    setStatusMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const result = await api.uploadFile({
            procedureId: selectedId,
            name: `Municipio_Obs_${Date.now()}_${file.name}`,
            base64: base64,
            mimeType: file.type
          });

          setAttachedImageUrl(result.url);
          setAttachedImageName(file.name);
          setStatusMessage({
            type: 'success',
            text: `Imagen "${file.name}" cargada correctamente e ingresada a la carpeta del trámite.`
          });
        } catch (error: any) {
          setStatusMessage({
            type: 'error',
            text: `Error al subir imagen: ${error.message}`
          });
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al leer archivo: ${err.message}`
      });
      setUploadingImage(false);
    }
  };

  const handleRemoveAttachedImage = () => {
    setAttachedImageUrl('');
    setAttachedImageName('');
    setStatusMessage(null);
  };

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

  // Edit Note Handlers
  const handleStartEdit = (log: ProcedureLog) => {
    setEditingLogId(log.id || null);
    setEditingLogText(log.note);
    setEditingIsExternal(String(log.isExternal) === 'true' || log.isExternal === true);
  };

  const handleSaveEdit = async (logId: string) => {
    if (!editingLogText.trim()) {
      setStatusMessage({ type: 'error', text: 'El contenido de la nota no puede estar vacío.' });
      return;
    }
    setUpdatingLogId(logId);
    setStatusMessage(null);
    try {
      await api.updateLog({
        id: logId,
        note: editingLogText.trim(),
        isExternal: editingIsExternal
      });
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, note: editingLogText.trim(), isExternal: editingIsExternal } : l));
      setEditingLogId(null);
      setEditingLogText('');
      setStatusMessage({ type: 'success', text: 'Nota actualizada exitosamente.' });
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 4000);
    } catch (err: any) {
      console.error("Error al actualizar la nota:", err);
      setStatusMessage({ type: 'error', text: `Error al actualizar nota: ${err.message}` });
    } finally {
      setUpdatingLogId(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    setStatusMessage(null);
    try {
      setUpdatingLogId(logId);
      await api.deleteLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      setDeletingLogId(null);
      setStatusMessage({ type: 'success', text: 'Nota eliminada exitosamente.' });
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 4000);
    } catch (err: any) {
      console.error("Error al eliminar la nota:", err);
      setStatusMessage({ type: 'error', text: `Error al eliminar nota: ${err.message}` });
    } finally {
      setUpdatingLogId(null);
    }
  };

  // Helper to render text with clickable links
  const renderNoteText = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#E3000F] hover:text-[#E3000F]/80 font-black hover:underline break-all transition-all"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
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
      const finalNoteText = attachedImageUrl 
        ? `${noteText.trim()}\n\n🔗 Imagen Adjunta (Drive): ${attachedImageUrl}`
        : noteText.trim();

      await api.addLog({
        procedureId: selectedId,
        technicianUsername: user?.username || '',
        note: finalNoteText,
        isExternal: isExternal,
        imageUrl: attachedImageUrl || ''
      });

      setStatusMessage({ 
        type: 'success', 
        text: `Comentario registrado exitosamente para el trámite ${selectedProcedure?.code || ''}.` 
      });
      setNoteText('');
      setAttachedImageUrl('');
      setAttachedImageName('');
      
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Reportar Nota de Trámite</h2>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Gestión de anotaciones y seguimiento técnico de trámites</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Procedure Finder (4 cols) - Hidden on mobile for height compactness */}
        <div className="hidden lg:flex lg:col-span-4 bg-white p-4.5 rounded-[20px] border border-gray-100 shadow-sm flex-col h-[calc(100vh-280px)] min-h-[500px]">
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
        <div className="lg:col-span-8 space-y-4">
          
          {/* Main Action card - Reporting Form */}
          <div className="bg-white p-3.5 sm:p-5 rounded-[20px] border border-gray-100 shadow-sm">
            {/* Quick selector for mobile devices */}
            {procedures.length > 0 && (
              <div className="block lg:hidden mb-3 space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Search className="w-3 h-3 text-[#E3000F]" />
                  Seleccionar Trámite (Móvil)
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setStatusMessage(null);
                  }}
                  className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-2.5 outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 text-[11px] font-black tracking-tight transition-all cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'><path d='m6 9 6 6 6-6'/></svg>")`,
                    backgroundPosition: 'right 10px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '14px'
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
              <div className="space-y-3">
                
                {/* Selected procedure info summary */}
                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block font-sans">Trámite Seleccionado</span>
                    <h3 className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#E3000F]" />
                      [{selectedProcedure.code}] {selectedProcedure.title}
                    </h3>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Propietario: {selectedProcedure.clientName} ({selectedProcedure.idNumber}) | Correo: {selectedProcedure.clientEmail || 'No registrado'}
                    </p>
                  </div>
                  
                  {selectedProcedure.driveUrl && (
                    <a 
                      href={selectedProcedure.driveUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1 px-2.5 py-1 self-start sm:self-center text-[8px] font-black uppercase tracking-widest text-[#E3000F] hover:text-[#B30009] bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-lg transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-3 h-3" />
                      Carpeta Drive
                      <ExternalLink className="w-2 h-2 opacity-65" />
                    </a>
                  )}
                </div>

                {/* Pill Tab Bar for Mobile Devices */}
                <div className="flex lg:hidden bg-gray-100 p-0.5 rounded-lg my-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${
                      activeTab === 'form' 
                        ? "bg-white text-[#E3000F] shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Nueva Nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 ${
                      activeTab === 'history' 
                        ? "bg-white text-[#E3000F] shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Historial ({logs.length})
                  </button>
                </div>

                <form 
                  onSubmit={handleSubmit} 
                  className={`space-y-3 ${activeTab === 'form' ? 'block' : 'hidden lg:block'}`}
                >
                  {/* Text editor and layout */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                      Contenido de la Nota
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escriba aquí los detalles correspondientes..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all font-sans"
                    />
                  </div>

                {/* Municipal Observation Image Attachment */}
                <div className="space-y-1 p-3 bg-stone-50 rounded-xl border border-stone-200/50">
                  <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest flex items-center gap-1">
                    <Image className="w-3.5 h-3.5 text-[#E3000F]" />
                    Captura / Observación de la Municipalidad (Opcional)
                  </label>

                  <div className="mt-2">
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-dashed border-red-200/80">
                        <Hourglass className="w-3.5 h-3.5 text-[#E3000F] animate-spin shrink-0" />
                        <span className="text-[9px] font-black text-stone-700 uppercase tracking-wider animate-pulse">
                          Subiendo archivo a Drive... Por favor, espere.
                        </span>
                      </div>
                    ) : attachedImageUrl ? (
                      <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-stone-200/60 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                            <img 
                              src={attachedImageUrl} 
                              alt="Adjunto" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-stone-900 truncate block leading-tight">
                              {attachedImageName || 'Imagen adjunta'}
                            </span>
                            <span className="text-[7.5px] font-bold text-emerald-600 block uppercase tracking-wider leading-none mt-0.5">
                              ✓ Subido con éxito
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachedImage}
                          className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded border border-rose-100 transition-colors shrink-0 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remover
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-3 bg-white hover:bg-stone-100/60 border border-dashed border-stone-300 rounded-lg cursor-pointer transition-all gap-1 text-center group">
                        <Upload className="w-4 h-4 text-stone-400 group-hover:text-[#E3000F] transition-colors" />
                        <span className="text-[9px] font-black text-stone-600 group-hover:text-stone-900 uppercase tracking-widest transition-colors mb-0.5">
                          Click para seleccionar captura
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Controls and submission */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-gray-100 gap-3">
                  {/* Visibility Toggler */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsExternal(prev => !prev)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isExternal ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className="sr-only">Comentario externo</span>
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isExternal ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="flex items-center gap-1">
                      {isExternal ? (
                        <Unlock className="w-3 h-3 text-emerald-500 animate-pulse" />
                      ) : (
                        <Lock className="w-3 h-3 text-rose-500" />
                      )}
                      <div>
                        <span className="text-[9px] font-black text-gray-900 uppercase tracking-wider block">
                          {isExternal ? 'Visible al Cliente' : 'Nota Solo Interna'}
                        </span>
                        <span className="text-[7.5px] text-gray-400 font-bold block uppercase tracking-wide">
                          {isExternal ? 'Nota visible en consulta pública' : 'Solo personal autorizado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-8 px-4 bg-[#E3000F] text-white border border-[#E3000F] rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 hover:border-red-700 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-900/10 cursor-pointer self-end"
                  >
                    <Send className={`w-3 h-3 ${submitting ? 'animate-bounce' : ''}`} />
                    {submitting ? 'Registrando...' : 'Registrar Nota'}
                  </button>
                </div>

                {/* Status messages */}
                {statusMessage && (
                  <div className={`mt-3 p-2.5 rounded-lg border flex items-start gap-2 animate-fadeIn ${
                    statusMessage.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-[9px] font-bold leading-normal">
                      {statusMessage.text}
                    </span>
                  </div>
                )}

                </form>
              </div>
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
            <div className={`bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-sm ${activeTab === 'history' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="flex items-center gap-1 text-[#C5B39A]">
                  <Clock className="w-3.5 h-3.5 text-[#C5B39A]" />
                  Historial de Notas del Trámite
                </span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  {logs.length} {logs.length === 1 ? 'Nota' : 'Notas'}
                </span>
              </h3>

              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Clock className="w-5 h-5 animate-spin text-[#E3000F]" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cargando bitácora...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/30 rounded-xl border border-gray-100">
                  <MessageSquare className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aún no se registran notas de bitácora.</p>
                </div>
              ) : (
                <div className="flow-root pl-1">
                  <ul className="-mb-6">
                    {logs.map((log, index) => {
                      const isLogExternal = String(log.isExternal) === 'true' || log.isExternal === true;
                      return (
                        <li key={log.id || index}>
                          <div className="relative pb-5">
                            {index !== logs.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-150" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-2">
                              {/* Icon background based on visibility */}
                              <div className={`relative flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm shrink-0 ${
                                isLogExternal 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                  : 'bg-rose-50 border-rose-100 text-rose-600'
                              }`}>
                                {isLogExternal ? (
                                  <Unlock className="w-3.5 h-3.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" />
                                )}
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-wider block">
                                      {log.technicianUsername ? `Técnico: ${log.technicianUsername}` : 'Personal Legarq'}
                                    </span>
                                    <label className="inline-flex items-center gap-1 cursor-pointer bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded-full select-none transition-all">
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
                                        className="w-2.5 h-2.5 text-[#E3000F] rounded border-gray-300 cursor-pointer focus:ring-[#E3000F]"
                                      />
                                      <span className={`text-[7.5px] font-black uppercase tracking-wide flex items-center gap-1 ${
                                        isLogExternal ? 'text-emerald-700' : 'text-rose-600'
                                      }`}>
                                        {isLogExternal ? 'Público' : 'Interno'}
                                        {updatingLogId === log.id && (
                                          <span className="w-1.5 h-1.5 border-2 border-dashed border-current rounded-full animate-spin inline-block"></span>
                                        )}
                                      </span>
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-1 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                    <Calendar className="w-2.5 h-2.5" />
                                    <span>
                                      {log.date ? new Date(log.date).toLocaleString('es-PE', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'Sin fecha'}
                                    </span>
                                    {log.id && editingLogId !== log.id && deletingLogId !== log.id && (
                                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-gray-200">
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(log)}
                                          title="Editar Nota"
                                          className="p-0.5 text-gray-400 hover:text-stone-800 hover:bg-stone-50 rounded transition-all cursor-pointer"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingLogId(log.id!)}
                                          title="Eliminar Nota"
                                          className="p-0.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {editingLogId === log.id ? (
                                  <div className="space-y-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60 mt-1.5">
                                    <textarea
                                      rows={2}
                                      value={editingLogText}
                                      onChange={(e) => setEditingLogText(e.target.value)}
                                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all font-sans"
                                      placeholder="Editar contenido de la nota..."
                                    />
                                    
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input 
                                          type="checkbox" 
                                          checked={editingIsExternal}
                                          onChange={(e) => setEditingIsExternal(e.target.checked)}
                                          className="w-3 h-3 text-[#E3000F] rounded border-gray-300 focus:ring-[#E3000F]"
                                        />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-stone-600">
                                          {editingIsExternal ? 'Público' : 'Solo Interno'}
                                        </span>
                                      </label>

                                      <div className="flex items-center gap-1 ml-auto">
                                        <button
                                          type="button"
                                          onClick={() => setEditingLogId(null)}
                                          className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[8px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-0.5 h-6 cursor-pointer"
                                        >
                                          <X className="w-2.5 h-2.5" /> Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEdit(log.id!)}
                                          disabled={updatingLogId === log.id}
                                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-widest rounded transition-all flex items-center gap-0.5 h-6 font-sans cursor-pointer disabled:opacity-50"
                                        >
                                          <Check className="w-2.5 h-2.5" /> Guardar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-1.5 text-xs font-medium text-gray-700 leading-relaxed bg-gray-50/50 hover:bg-gray-50 p-2.5 rounded-lg border border-gray-100/50 whitespace-pre-line">
                                    {renderNoteText(log.note)}
                                  </div>
                                )}

                                {deletingLogId === log.id && (
                                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 animate-fadeIn">
                                    <div className="flex items-start gap-1.5 text-left">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-[9px] font-black text-rose-950 uppercase tracking-wide block">¿Confirmar eliminación?</span>
                                        <span className="text-[8px] text-rose-700 font-bold block uppercase tracking-wide">Acción irreversible.</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setDeletingLogId(null)}
                                        className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-rose-200/50 text-stone-700 text-[8px] font-black uppercase tracking-wider rounded h-6 cursor-pointer"
                                      >
                                        No
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLog(log.id!)}
                                        disabled={updatingLogId === log.id}
                                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black uppercase tracking-wider rounded h-6 shadow-sm flex items-center gap-0.5 cursor-pointer"
                                      >
                                        {updatingLogId === log.id ? (
                                          <span className="w-2 h-2 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                                        ) : (
                                          <Trash2 className="w-2.5 h-2.5" />
                                        )}
                                        Sí, Eliminar
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {log.imageUrl && (
                                  <div className="mt-2 max-w-sm space-y-1.5">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Evidencia / Captura del Municipio</span>
                                    <div className="flex items-center">
                                      <a 
                                        href={log.imageUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#E3000F]/10 hover:bg-[#E3000F]/15 text-[#E3000F] hover:text-[#E3000F] text-[9px] font-black uppercase tracking-wider rounded border border-[#E3000F]/20 transition-all shadow-sm"
                                      >
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        Ver Enlace Directo
                                      </a>
                                    </div>
                                    <a 
                                      href={log.imageUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="block rounded-lg border border-gray-150 overflow-hidden relative group/img bg-stone-50 cursor-pointer max-w-[240px]"
                                    >
                                      <img 
                                        src={log.imageUrl} 
                                        alt="Captura Municipio" 
                                        className="max-h-28 w-full object-cover hover:scale-105 transition-transform duration-300" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-stone-950/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                                        <span className="bg-white/95 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider text-stone-800 shadow-sm border border-stone-200 flex items-center gap-0.5">
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          Ampliar
                                        </span>
                                      </div>
                                    </a>
                                  </div>
                                )}
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
