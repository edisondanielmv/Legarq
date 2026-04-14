import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Search, Loader2, FileText, User as UserIcon, Calendar, Briefcase, ExternalLink, CheckCircle2, Eye, Hash, ArrowRight, X } from 'lucide-react';
import clsx from 'clsx';
import { Procedure, User, ProcedureType } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';

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
  const [successMessage, setSuccessMessage] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newProc, setNewProc] = useState({ 
    clientName: '',
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
      // Use procedureType as title, do NOT include client name
      const result = await api.createProcedure({
        clientName: newProc.clientName,
        procedureType: newProc.procedureType,
        title: newProc.procedureType,
      });
      
      setShowNewModal(false);
      setNewProc({ 
        clientName: '',
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

  const filtered = procedures.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.clientUsername && p.clientUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.idNumber && String(p.idNumber).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En proceso': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Finalizado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (loading && procedures.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando trámites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">
      {saving && <LoadingOverlay />}
      
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de <span className="text-[#E3000F]">Trámites</span></h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Seguimiento de proyectos en tiempo real</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <a
            href="/consulta"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#E3000F]" /> Simular Consulta
          </a>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex-1 md:flex-none bg-[#1A1A1A] text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 font-black text-[10px] uppercase tracking-widest active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo Trámite
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código, título, cliente o cédula..."
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-transparent rounded-[24px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-sm font-black text-gray-900 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-2">
          <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-lg">{filtered.length}</span> Trámites
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hidden md:block">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Código</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Proyecto</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Técnico</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((proc) => (
              <tr 
                key={proc.id} 
                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/dashboard/procedures/${proc.id}`)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[9px] font-mono font-black text-[#E3000F] bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                    {proc.code || '---'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl group-hover:bg-[#E3000F]/10 transition-colors border border-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-400 group-hover:text-[#E3000F]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900 group-hover:text-[#E3000F] transition-colors tracking-tight">{proc.title}</div>
                      <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.procedureType}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-xs font-black text-gray-700">{proc.clientName || 'Sin nombre'}</div>
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.idNumber || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-[9px] font-black text-[#E3000F] border border-gray-100">
                      {(proc.technicianName || proc.technicianUsername || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">
                      {proc.technicianName || proc.technicianUsername || 'Sin asignar'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={clsx("px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border", getStatusColor(proc.status))}>
                    {proc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filtered.map((proc) => (
          <div key={proc.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group active:scale-[0.98] transition-all">
            <Link to={`/dashboard/procedures/${proc.id}`} className="block p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                  <span className={clsx(
                    "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit",
                    proc.status === 'Finalizado' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    proc.status === 'En proceso' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-gray-50 text-gray-600 border-gray-100"
                  )}>
                    {proc.status}
                  </span>
                  <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <Hash className="w-3.5 h-3.5 text-[#E3000F]" /> {proc.code || '---'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 tracking-tight mb-6 leading-tight">
                {proc.title}
              </h3>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                    <span className="text-[10px] font-black text-gray-700 truncate">{proc.clientName || 'Sin nombre'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Técnico</span>
                    <span className="text-[10px] font-black text-gray-700 truncate">{proc.technicianName || proc.technicianUsername || 'Sin asignar'}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-20 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center border border-gray-100">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">No se encontraron trámites</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Intente con otros términos de búsqueda</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Trámite */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="p-8 bg-[#1A1A1A] text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E3000F]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Nuevo Trámite</h3>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Inicio de proceso legal o constructivo</p>
                </div>
                <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nombre del Dueño del Predio</label>
                  <input 
                    required 
                    type="text" 
                    value={newProc.clientName} 
                    onChange={e => setNewProc({...newProc, clientName: e.target.value})} 
                    className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" 
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tipo de Trámite</label>
                  <select 
                    required
                    value={newProc.procedureType} 
                    onChange={e => setNewProc({...newProc, procedureType: e.target.value})}
                    className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar Producto</option>
                    {procedureTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-8 py-4 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#E3000F] shadow-xl shadow-gray-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
