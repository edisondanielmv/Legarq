import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Search, Hourglass, FileText, User as UserIcon, Calendar, Briefcase, ExternalLink, CheckCircle2, Eye, Hash, ArrowRight, X, Clock, FolderOpen, Upload, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import clsx from 'clsx';
import { Procedure, User, ProcedureType } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import { BulkUpload } from '../../components/BulkUpload';

export default function Procedures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newProc, setNewProc] = useState({ 
    clientName: '',
    clientEmail: '',
    procedureType: ''
  });

  useEffect(() => {
    fetchProcedures();
    if (user?.role === 'admin') {
      fetchUsers();
      fetchProcedureTypes();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers('admin');
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchProcedureTypes = async () => {
    try {
      const data = await api.getProcedureTypes();
      setProcedureTypes(data);
    } catch (err) {
      console.error("Error fetching procedure types:", err);
    }
  };

  const fetchProcedures = async () => {
    try {
      const data = await api.getProcedures({ username: user?.username || '', role: user?.role || '' });
      setProcedures(data);
    } catch (err: any) {
      if (err.message === 'SETUP_REQUIRED') navigate('/setup');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Auto-generate email if missing
      const clientEmail = newProc.clientEmail.trim() || 
        `${newProc.clientName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}@legarq.com`;

      // Use procedureType as title, do NOT include client name
      const result = await api.createProcedure({
        clientName: newProc.clientName,
        clientEmail: clientEmail,
        procedureType: newProc.procedureType,
        title: newProc.procedureType,
      });
      
      setShowNewModal(false);
      setNewProc({ 
        clientName: '',
        clientEmail: '',
        procedureType: ''
      });
      
      const driveMsg = result.driveUrl 
        ? 'Se ha generado la carpeta en Google Drive.' 
        : 'No se pudo generar la carpeta automáticamente.';
      
      showSuccess(`Trámite creado exitosamente. ${driveMsg}`);
      await fetchProcedures();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si ya estamos procesando, no permitir otro click
    if (saving) return;

    // Primer click: Pedir confirmación visual
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Resetear confirmación tras 3 segundos
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    console.log(`[FRONTEND] Ejecutando ELIMINACIÓN CONFIRMADA: ID=${id}, CODE=${code}`);
    setSaving(true);
    setConfirmDeleteId(null);
    setError('');
    
    try {
      await api.deleteProcedure(id);
      showSuccess(`Trámite ${code} eliminado.`);
      await fetchProcedures();
    } catch (err: any) {
      console.error(`[FRONTEND] Error al eliminar trámite ${code}:`, err);
      
      if (code) {
        try {
          await api.deleteProcedure(code);
          showSuccess(`Trámite ${code} eliminado (vía código).`);
          await fetchProcedures();
          return;
        } catch (retryErr) {}
      }
      
      setError(`Error: ${err.message || 'No se pudo eliminar'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleForceDeleteByCode = async () => {
    const code = window.prompt("Ingrese el CÓDIGO del trámite que desea eliminar (ej. TR-0001):");
    if (!code) return;
    
    if (!window.confirm(`¿FORZAR ELIMINACIÓN del trámite ${code}? Se borrarán todos los datos asociados.`)) {
      return;
    }

    setSaving(true);
    try {
      await api.deleteProcedure(code);
      showSuccess(`Trámite ${code} eliminado forzosamente.`);
      await fetchProcedures();
    } catch (err: any) {
      setError(`Error en eliminación forzada: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = procedures.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.clientUsername || '').toLowerCase().includes(term) ||
      (p.clientName || '').toLowerCase().includes(term) ||
      String(p.idNumber || '').toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En proceso': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Finalizado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const calculateDaysElapsed = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    return Math.max(0, differenceInDays(endDate, startDate));
  };

  if (loading && procedures.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Hourglass className="w-10 h-10 animate-pulse text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando trámites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">
      {saving && <LoadingOverlay />}
      
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-[#1A1A1A] text-white px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de <span className="text-[#E3000F]">Trámites</span></h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Seguimiento de proyectos en tiempo real</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <a
            href="/consulta"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-100 h-10 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-[#E3000F]" /> Simular Consulta
          </a>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleForceDeleteByCode}
                className="flex-1 md:flex-none bg-red-50 text-red-600 border border-red-100 h-10 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95"
                title="Método alternativo para eliminar por código"
              >
                <Hash className="w-3.5 h-3.5" /> Eliminar por Código
              </button>
              <BulkUpload 
                onSuccess={fetchProcedures} 
                procedureTypes={procedureTypes} 
                technicians={users.filter(u => u.role === 'tech')} 
              />
              <button
                onClick={() => setShowNewModal(true)}
                className="flex-1 md:flex-none bg-[#1A1A1A] text-white h-10 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 font-black text-[9px] uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Trámite
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-1.5 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por código, título, cliente o cédula..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-xs font-black text-gray-900 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:text-[9px] placeholder:tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-1.5">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 rounded-md">{filtered.length}</span> Trámites
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden hidden md:block">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Código</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Proyecto</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Técnico</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Días</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
              <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Carpeta</th>
              {user?.role === 'admin' && <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((proc) => (
              <tr 
                key={proc.id} 
                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/dashboard/procedures/${proc.id}`)}
              >
                <td className="px-6 py-2 whitespace-nowrap">
                  <span className="text-[8px] font-mono font-black text-[#E3000F] bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                    {proc.code || '---'}
                  </span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg group-hover:bg-[#E3000F]/10 transition-colors border border-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E3000F]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-gray-900 group-hover:text-[#E3000F] transition-colors tracking-tight">{proc.title}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.procedureType}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-[11px] font-black text-gray-700">{proc.clientName || 'Sin nombre'}</div>
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.idNumber || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className={clsx(
                    "flex items-center gap-2 px-3 py-1 rounded-xl border transition-all",
                    proc.technicianUsername 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                      : "bg-red-50 border-red-100 text-red-700"
                  )}>
                    <div className={clsx(
                      "w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black border",
                      proc.technicianUsername ? "bg-white border-emerald-200" : "bg-white border-red-200"
                    )}>
                      {(proc.technicianName || proc.technicianUsername || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight">
                      {proc.technicianName || proc.technicianUsername || 'Sin asignar'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest w-fit">
                    <Clock className="w-3 h-3" /> {calculateDaysElapsed(proc.createdAt, proc.completedAt)}
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <span className={clsx("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border", getStatusColor(proc.status))}>
                    {proc.status}
                  </span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  {proc.driveUrl ? (
                    <a
                      href={proc.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm group/folder"
                      title="Abrir Carpeta Virtual"
                    >
                      <FolderOpen className="w-4 h-4 group-hover/folder:scale-110 transition-transform" />
                    </a>
                  ) : (
                    <div className="w-8 h-8 bg-gray-50 text-gray-300 rounded-lg flex items-center justify-center border border-gray-100 cursor-not-allowed" title="Carpeta no disponible">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                  )}
                </td>
                {user?.role === 'admin' && (
                  <td className="px-6 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, proc.id, proc.code || '')}
                      disabled={saving}
                      className={clsx(
                        "h-9 min-w-[36px] px-2 rounded-lg flex items-center justify-center transition-all border shadow-sm group/delete font-black text-[8px] uppercase tracking-tighter",
                        saving 
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                          : confirmDeleteId === proc.id
                            ? "bg-red-600 text-white border-red-600 animate-pulse font-black text-[7px]"
                            : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                      )}
                      title={confirmDeleteId === proc.id ? "Haga clic de nuevo para confirmar" : "Eliminar Trámite"}
                    >
                      {saving ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : confirmDeleteId === proc.id ? (
                        "¿SI?"
                      ) : (
                        <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.map((proc) => (
          <div 
            key={proc.id} 
            className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => navigate(`/dashboard/procedures/${proc.id}`)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border w-fit",
                    proc.status === 'Finalizado' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    proc.status === 'En proceso' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-gray-50 text-gray-600 border-gray-100"
                  )}>
                    {proc.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    <Hash className="w-3 h-3 text-[#E3000F]" /> {proc.code || '---'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest w-fit mt-1">
                    <Clock className="w-3 h-3" /> {calculateDaysElapsed(proc.createdAt, proc.completedAt)} días
                  </div>
                  {proc.driveUrl && (
                    <a
                      href={proc.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest w-fit mt-1"
                    >
                      <FolderOpen className="w-3 h-3" /> Carpeta Virtual
                    </a>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, proc.id, proc.code || '')}
                      className={clsx(
                        "flex items-center gap-1.5 text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest w-fit mt-1",
                        confirmDeleteId === proc.id
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-red-50 text-red-600 border-red-100"
                      )}
                    >
                      {confirmDeleteId === proc.id ? <AlertCircle className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                      {confirmDeleteId === proc.id ? "¡CONFIRMAR ELIMINACIÓN!" : "Eliminar"}
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <h3 className="text-sm font-black text-gray-900 tracking-tight mb-3 leading-tight">
                {proc.title}
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                    <span className="text-[9px] font-black text-gray-700 truncate">{proc.clientName || 'Sin nombre'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                    proc.technicianUsername ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                  )}>
                    <Briefcase className={clsx("w-3.5 h-3.5", proc.technicianUsername ? "text-emerald-600" : "text-red-600")} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Técnico</span>
                    <span className={clsx(
                      "text-[9px] font-black truncate",
                      proc.technicianUsername ? "text-emerald-700" : "text-red-700"
                    )}>
                      {proc.technicianName || proc.technicianUsername || 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-12 text-center bg-white rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center border border-gray-100">
              <Search className="w-8 h-8 text-gray-200" />
            </div>
            <div>
              <p className="text-base font-black text-gray-900">No se encontraron trámites</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Intente con otros términos de búsqueda</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Trámite */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="p-6 bg-[#1A1A1A] text-white relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E3000F]/10 rounded-full -mr-12 -mt-12 blur-2xl" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Nuevo Trámite</h3>
                  <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Inicio de proceso legal o constructivo</p>
                </div>
                <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Dueño del Predio</label>
                  <input 
                    required 
                    type="text" 
                    value={newProc.clientName} 
                    onChange={e => setNewProc({...newProc, clientName: e.target.value})} 
                    className="w-full bg-gray-50 border-transparent rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-xs font-black tracking-tight transition-all" 
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Correo Electrónico (Opcional)</label>
                  <input 
                    type="email" 
                    value={newProc.clientEmail} 
                    onChange={e => setNewProc({...newProc, clientEmail: e.target.value})} 
                    className="w-full bg-gray-50 border-transparent rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-xs font-black tracking-tight transition-all" 
                    placeholder="ejemplo@correo.com (Se generará uno si se deja vacío)" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Trámite</label>
                  <select 
                    required
                    value={newProc.procedureType} 
                    onChange={e => setNewProc({...newProc, procedureType: e.target.value})}
                    className="w-full bg-gray-50 border-transparent rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-xs font-black tracking-tight transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar Producto</option>
                    {procedureTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="h-10 px-6 bg-[#1A1A1A] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#E3000F] shadow-xl shadow-gray-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Hourglass className="w-3.5 h-3.5 animate-pulse" /> : <Plus className="w-3.5 h-3.5" />}
                  Crear Trámite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
