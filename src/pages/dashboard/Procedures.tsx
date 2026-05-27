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
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'En proceso' | 'Suspendido' | 'Finalizado'>('Todos');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientUsername, setSelectedClientUsername] = useState<string>('');
  const [newClientDocId, setNewClientDocId] = useState<string>('');
  const [newProc, setNewProc] = useState({ 
    clientName: '',
    clientEmail: '',
    procedureType: '',
    platformNumber: ''
  });

  interface ClientOption {
    username: string;
    name: string;
    idNumber?: string;
    email?: string;
  }

  // Combine client accounts from users table and procedure metadata (such as bulk uploads / procedures without user accounts)
  const clientsFromUsers: ClientOption[] = (users || [])
    .filter(u => {
      const r = (u.role || '').trim().toLowerCase();
      // Filter role to get all client roles or anything that isn't admin/tech/finance/other specialized non-clients
      return r === 'client' || r === 'cliente' || (!r || !['admin', 'tech', 'finance'].includes(r));
    })
    .map(u => ({
      username: u.username,
      name: u.name,
      idNumber: u.idNumber,
      email: u.email
    }));

  const clientsFromProcedures: ClientOption[] = [];
  (procedures || []).forEach(p => {
    if (p.clientUsername && p.clientName) {
      const existsInUsers = clientsFromUsers.some(c => c.username.toLowerCase() === p.clientUsername.toLowerCase());
      const existsInProcs = clientsFromProcedures.some(c => c.username.toLowerCase() === p.clientUsername.toLowerCase());
      if (!existsInUsers && !existsInProcs) {
        clientsFromProcedures.push({
          username: p.clientUsername,
          name: p.clientName,
          idNumber: p.idNumber,
          email: p.clientEmail
        });
      }
    }
  });

  const allClients: ClientOption[] = [...clientsFromUsers, ...clientsFromProcedures].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );

  useEffect(() => {
    fetchProcedures();
    if (user?.role === 'admin' || user?.role === 'tech') {
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
      let clientName = '';
      let clientEmail = '';
      let idNumber = '';
      let clientUsername = '';

      if (clientMode === 'existing') {
        const found = allClients.find(c => c.username === selectedClientUsername);
        if (!found) {
          throw new Error('Debe seleccionar un cliente de la lista.');
        }
        clientName = found.name;
        clientEmail = found.email || '';
        idNumber = found.idNumber || '';
        clientUsername = found.username;
      } else {
        if (!newProc.clientName.trim()) {
          throw new Error('Debe ingresar el nombre del nuevo cliente.');
        }
        clientName = newProc.clientName.trim();
        clientEmail = newProc.clientEmail.trim() || 
          `${clientName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}@legarq.com`;
        idNumber = newClientDocId.trim();
      }

      // Use procedureType as title, do NOT include client name
      const result = await api.createProcedure({
        clientName,
        clientUsername,
        clientEmail,
        idNumber,
        procedureType: newProc.procedureType,
        title: newProc.procedureType,
        platformNumber: newProc.platformNumber
      });
      
      setShowNewModal(false);
      setNewProc({ 
        clientName: '',
        clientEmail: '',
        procedureType: '',
        platformNumber: ''
      });
      setNewClientDocId('');
      setSelectedClientUsername('');
      
      const driveMsg = result.driveUrl 
        ? 'Se ha asignado/generado la carpeta del cliente en Google Drive.' 
        : 'No se pudo generar/vincular la carpeta en Google Drive automáticamente.';
      
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

  const handleAssignTechnician = async (procedureId: string, technicianUsername: string) => {
    setSaving(true);
    setError('');
    try {
      await api.assignTechnician({ procedureId, technicianUsername });
      showSuccess('Técnico asignado correctamente.');
      await fetchProcedures();
    } catch (err: any) {
      setError(`Error al asignar técnico: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setSaving(true);
    setError('');
    try {
      await api.updateProcedureStatus({ id, status });
      showSuccess('Estado actualizado correctamente.');
      await fetchProcedures();
    } catch (err: any) {
      setError(`Error al actualizar estado: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = procedures.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (p.title || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.clientUsername || '').toLowerCase().includes(term) ||
      (p.clientName || '').toLowerCase().includes(term) ||
      String(p.idNumber || '').toLowerCase().includes(term)
    );
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En proceso': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Suspendido': return 'bg-rose-50 text-rose-600 border-rose-100';
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
    <div className="space-y-4 max-w-6xl mx-auto py-2 sm:py-4 px-3 sm:px-4 relative font-sans selection:bg-[#E3000F] selection:text-white">
      {saving && <LoadingOverlay />}
      
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-[#1A1A1A] text-white px-3 py-2.5 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="w-5 h-5 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}
 
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#E3000F] text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-100 shrink-0">
             <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Gestión de <span className="text-[#E3000F]">Trámites</span></h1>
            <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Seguimiento en tiempo real</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <a
            href="/consulta"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-100 h-9 md:h-10 px-3 md:px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-black text-[8px] md:text-[9px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#E3000F]" /> <span className="hidden xs:inline">Consultar</span><span className="xs:hidden">Ver</span>
          </a>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <BulkUpload 
                onSuccess={fetchProcedures} 
                procedureTypes={procedureTypes} 
                technicians={users.filter(u => u.role === 'tech')} 
              />
              <button
                onClick={() => setShowNewModal(true)}
                className="flex-1 md:flex-none bg-[#1A1A1A] text-white h-9 md:h-10 px-3 md:px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 font-black text-[8px] md:text-[9px] uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden xs:inline">Nuevo Trámite</span><span className="xs:hidden">Nuevo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters, Search & Status Selectors */}
      <div className="bg-white p-2 sm:p-3 rounded-[24px] border border-gray-100 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[10px] sm:text-xs font-black text-gray-900 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:text-[8px] placeholder:tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 shrink-0 self-end md:self-auto">
            <span className="bg-[#1A1A1A] text-white px-2 py-0.5 rounded-md font-mono">{filtered.length}</span> Trámites filtrados
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-50">
          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400 mr-1 hidden sm:inline">Filtrar por Estado:</span>
          {(['Todos', 'En proceso', 'Suspendido', 'Finalizado'] as const).map((status) => {
            const isActive = statusFilter === status;
            const count = procedures.filter(p => status === 'Todos' || p.status === status).length;
            
            let countColor = "bg-gray-100 text-gray-500";
            let activeStyles = "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md shadow-gray-100";
            let inactiveStyles = "text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-900";
            
            if (isActive) {
              if (status === 'En proceso') {
                activeStyles = "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-50";
                countColor = "bg-amber-800/30 text-white";
              } else if (status === 'Suspendido') {
                activeStyles = "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-50";
                countColor = "bg-rose-800/30 text-white";
              } else if (status === 'Finalizado') {
                activeStyles = "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-50";
                countColor = "bg-emerald-800/30 text-white";
              } else {
                countColor = "bg-white/30 text-white";
              }
            } else {
              countColor = "bg-gray-100 text-gray-400 group-hover:text-gray-500";
            }

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  "px-2 px-2.5 sm:px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 border active:scale-95 group rounded-xl",
                  isActive ? activeStyles : inactiveStyles
                )}
              >
                <span>{status}</span>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-lg text-[6.5px] font-mono leading-none font-bold transition-all",
                  countColor
                )}>
                  {count}
                </span>
              </button>
            );
          })}
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
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden hidden md:block w-full">
        <table className="w-full divide-y divide-gray-50 table-auto">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[8%]">Código</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[24%]">Proyecto</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[22%]">Cliente</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[22%]">Técnico</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[8%]">Días</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[10%]">Estado</th>
              <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[4%]">Carpeta</th>
              {user?.role === 'admin' && <th className="px-3 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap w-[4%]">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((proc) => (
              <tr 
                key={proc.id} 
                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/dashboard/procedures/${proc.id}`)}
              >
                <td className="px-3 py-2">
                  <span className="text-[8px] font-mono font-black text-[#E3000F] bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 whitespace-nowrap">
                    {proc.code || '---'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-normal break-words">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg group-hover:bg-[#E3000F]/10 transition-colors border border-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E3000F]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-gray-900 group-hover:text-[#E3000F] transition-colors tracking-tight line-clamp-2 md:line-clamp-none">{proc.title}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.procedureType}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-normal break-words">
                  <div className="flex flex-col min-w-0">
                    <div className="text-[11px] font-black text-gray-700 leading-tight">{proc.clientName || 'Sin nombre'}</div>
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.idNumber || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-normal" onClick={(e) => e.stopPropagation()}>
                  {user?.role === 'admin' ? (
                    <div className="flex items-center w-full">
                      <select
                        value={proc.technicianUsername || ''}
                        onChange={(e) => handleAssignTechnician(proc.id, e.target.value)}
                        disabled={saving}
                        className={clsx(
                          "w-full text-[9px] font-black uppercase tracking-wider pl-2 pr-6 py-1 rounded-md border focus:outline-none focus:ring-1 cursor-pointer transition-all appearance-none relative bg-no-repeat truncate",
                          proc.technicianUsername 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-400" 
                            : "bg-red-50 border-red-200 text-red-700 focus:ring-red-400"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.4rem center",
                          backgroundSize: "0.5rem"
                        }}
                      >
                        <option value="" className="text-gray-500 font-black">--- Sin asignar ---</option>
                        {users
                          .filter(u => {
                            const r = (u.role || '').toLowerCase().trim();
                            return r === 'tech' || r === 'tecnico' || r === 'admin';
                          })
                          .map(tech => (
                            <option key={tech.username} value={tech.username} className="text-gray-905 font-extrabold bg-white">
                              {tech.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <div className={clsx(
                      "flex items-center gap-2 px-2 py-1 rounded-lg border transition-all w-fit max-w-full",
                      proc.technicianUsername 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                        : "bg-red-50 border-red-100 text-red-700"
                    )}>
                      <div className={clsx(
                        "w-5 h-5 rounded flex items-center justify-center text-[8px] font-black border shrink-0",
                        proc.technicianUsername ? "bg-white border-emerald-200" : "bg-white border-red-200"
                      )}>
                        {(proc.technicianName || proc.technicianUsername || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-[80px]">
                        {proc.technicianName || proc.technicianUsername || 'Sin asignar'}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest w-fit">
                    <Clock className="w-3 h-3" /> {calculateDaysElapsed(proc.createdAt, proc.completedAt)}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {user?.role === 'admin' ? (
                    <div className="flex items-center w-full">
                      <select
                        value={proc.status}
                        onChange={(e) => handleUpdateStatus(proc.id, e.target.value)}
                        disabled={saving}
                        className={clsx(
                          "w-full text-[8px] font-black uppercase tracking-widest pl-2 pr-6 py-1 rounded-full border focus:outline-none focus:ring-1 cursor-pointer transition-all appearance-none relative bg-no-repeat",
                          getStatusColor(proc.status)
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.4rem center",
                          backgroundSize: "0.5rem"
                        }}
                      >
                        <option value="Ingresado" className="text-gray-900 bg-white">Ingresado</option>
                        <option value="En proceso" className="text-gray-900 bg-white">En proceso</option>
                        <option value="Observado" className="text-gray-900 bg-white">Observado</option>
                        <option value="Subsanado" className="text-gray-900 bg-white">Subsanado</option>
                        <option value="Suspendido" className="text-gray-900 bg-white">Suspendido</option>
                        <option value="Finalizado" className="text-gray-900 bg-white">Finalizado</option>
                      </select>
                    </div>
                  ) : (
                    <span className={clsx("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border", getStatusColor(proc.status))}>
                      {proc.status}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {proc.driveUrl ? (
                    <a
                      href={proc.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm group/folder"
                      title="Abrir Carpeta Virtual"
                    >
                      <FolderOpen className="w-3.5 h-3.5 group-hover/folder:scale-110 transition-transform" />
                    </a>
                  ) : (
                    <div className="w-7 h-7 bg-gray-50 text-gray-300 rounded-lg flex items-center justify-center border border-gray-100 cursor-not-allowed" title="Carpeta no disponible">
                      <FolderOpen className="w-3.5 h-3.5" />
                    </div>
                  )}
                </td>
                {user?.role === 'admin' && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, proc.id, proc.code || '')}
                      disabled={saving}
                      className={clsx(
                        "h-8 min-w-[32px] px-1.5 rounded-lg flex items-center justify-center transition-all border shadow-sm group/delete font-black text-[8px] uppercase tracking-tighter cursor-pointer",
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
                        <Trash2 className="w-3.5 h-3.5 group-hover/delete:scale-110 transition-transform" />
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
      <div className="md:hidden space-y-2">
        {filtered.map((proc) => (
          <div 
            key={proc.id} 
            className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => navigate(`/dashboard/procedures/${proc.id}`)}
          >
            <div className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5" onClick={(e) => user?.role === 'admin' && e.stopPropagation()}>
                    {user?.role === 'admin' ? (
                      <select
                        value={proc.status}
                        onChange={(e) => handleUpdateStatus(proc.id, e.target.value)}
                        disabled={saving}
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-widest border w-fit focus:outline-none appearance-none cursor-pointer pr-4 relative bg-no-repeat",
                          getStatusColor(proc.status)
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.2rem center",
                          backgroundSize: "0.4rem"
                        }}
                      >
                        <option value="Ingresado" className="text-gray-900 bg-white">Ingresado</option>
                        <option value="En proceso" className="text-gray-900 bg-white">En proceso</option>
                        <option value="Observado" className="text-gray-900 bg-white">Observado</option>
                        <option value="Subsanado" className="text-gray-900 bg-white">Subsanado</option>
                        <option value="Suspendido" className="text-gray-900 bg-white">Suspendido</option>
                        <option value="Finalizado" className="text-gray-900 bg-white">Finalizado</option>
                      </select>
                    ) : (
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-widest border w-fit",
                        getStatusColor(proc.status)
                      )}>
                        {proc.status}
                      </span>
                    )}
                    <span className="text-[7.5px] font-mono font-black text-[#E3000F] bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 tracking-tight">
                      {proc.code || '---'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>

              <h3 className="text-[11px] font-black text-gray-900 tracking-tight mb-2 leading-tight">
                {proc.title}
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                 <div className="flex items-center gap-1 text-[7px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest w-fit">
                    <Clock className="w-2.5 h-2.5" /> {calculateDaysElapsed(proc.createdAt, proc.completedAt)} d
                 </div>
                 {proc.driveUrl && (
                    <a
                      href={proc.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[7px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest w-fit"
                    >
                      <FolderOpen className="w-2.5 h-2.5" /> Drive
                    </a>
                 )}
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  {/* Cliente info */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                      <span className="text-[8px] font-black text-gray-700 truncate">{proc.clientName || 'Sin nombre'}</span>
                    </div>
                  </div>

                  {/* Técnico info */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Técnico</span>
                    {user?.role === 'admin' ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={proc.technicianUsername || ''}
                          onChange={(e) => handleAssignTechnician(proc.id, e.target.value)}
                          disabled={saving}
                          className={clsx(
                            "w-full text-[8px] font-black uppercase tracking-tight py-0.5 px-1 rounded border focus:outline-none cursor-pointer text-ellipsis overflow-hidden",
                            proc.technicianUsername 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                              : "bg-red-50 border-red-100 text-red-700"
                          )}
                        >
                          <option value="">-- Sin asignar --</option>
                          {users
                            .filter(u => {
                              const r = (u.role || '').toLowerCase().trim();
                              return r === 'tech' || r === 'tecnico' || r === 'admin';
                            })
                            .map(tech => (
                              <option key={tech.username} value={tech.username}>
                                {tech.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[8px] font-black text-gray-700 truncate">
                        {proc.technicianName || proc.technicianUsername || 'Sin asignar'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones de admin en móvil (Eliminar) */}
                {user?.role === 'admin' && (
                  <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, proc.id, proc.code || '')}
                      disabled={saving}
                      className={clsx(
                        "flex items-center gap-1 text-[7px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest w-fit",
                        confirmDeleteId === proc.id
                          ? "bg-red-600 text-white border-red-600 active:scale-95 animate-pulse"
                          : "bg-red-50 text-red-600 border-red-100 active:scale-95"
                      )}
                    >
                      {confirmDeleteId === proc.id ? <AlertCircle className="w-2.5 h-2.5" /> : <Trash2 className="w-2.5 h-2.5" />}
                      {confirmDeleteId === proc.id ? "¡CONFIRMAR!" : "Borrar Trámite"}
                    </button>
                  </div>
                )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3.5 z-50">
          <div className="bg-white rounded-[20px] shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-3.5 bg-[#1A1A1A] text-white relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#E3000F]/10 rounded-full -mr-10 -mt-10 blur-xl" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-base font-black tracking-tight">Nuevo Trámite</h3>
                  <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-0.5">Inicio de proceso legal o constructivo</p>
                </div>
                <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3.5">
              <div className="space-y-3">
                {/* Selector de modo de cliente */}
                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Asociar al Cliente</label>
                  <div className="grid grid-cols-2 gap-1 bg-gray-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={clsx(
                        "py-1 text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all",
                        clientMode === 'existing' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-905"
                      )}
                    >
                      Cliente Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('new')}
                      className={clsx(
                        "py-1 text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all",
                        clientMode === 'new' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-905"
                      )}
                    >
                      Nuevo Cliente
                    </button>
                  </div>
                </div>

                {clientMode === 'existing' ? (
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Seleccionar Cliente de la Lista</label>
                    <select
                      required={clientMode === 'existing'}
                      value={selectedClientUsername}
                      onChange={e => setSelectedClientUsername(e.target.value)}
                      className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {allClients.map(c => (
                        <option key={c.username} value={c.username}>
                          {c.name} {c.idNumber ? `(${c.idNumber})` : `(${c.username})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nombre del Dueño del Predio / Cliente</label>
                      <input 
                        required={clientMode === 'new'}
                        type="text" 
                        value={newProc.clientName} 
                        onChange={e => setNewProc({...newProc, clientName: e.target.value})} 
                        className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all" 
                        placeholder="Ej. Juan Pérez" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">DNI / RUC del Cliente</label>
                      <input 
                        type="text" 
                        value={newClientDocId} 
                        onChange={e => setNewClientDocId(e.target.value)} 
                        className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all" 
                        placeholder="DNI, RUC u otro documento de identidad" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Correo Electrónico (Opcional)</label>
                      <input 
                        type="email" 
                        value={newProc.clientEmail} 
                        onChange={e => setNewProc({...newProc, clientEmail: e.target.value})} 
                        className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all" 
                        placeholder="ejemplo@correo.com (Se generará uno si se deja vacío)" 
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipo de Trámite</label>
                  <select 
                    required
                    value={newProc.procedureType} 
                    onChange={e => setNewProc({...newProc, procedureType: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar Producto</option>
                    {procedureTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Número de Trámite en Plataforma</label>
                  <input 
                    type="text" 
                    value={newProc.platformNumber} 
                    onChange={e => setNewProc({...newProc, platformNumber: e.target.value})} 
                    className="w-full bg-gray-50 border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#E3000F]/30 focus:bg-white border text-[11px] font-black tracking-tight transition-all" 
                    placeholder="Opcional: Número asignado por plataforma externa" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="h-8.5 px-4 bg-[#1A1A1A] text-white text-[8.5px] font-black uppercase tracking-widest rounded-lg hover:bg-[#E3000F] shadow-md shadow-gray-200 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Hourglass className="w-3 h-3 animate-pulse" /> : <Plus className="w-3 h-3" />}
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
