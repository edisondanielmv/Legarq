import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Search, Loader2, FileText, User as UserIcon, Calendar, Briefcase, ExternalLink, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { Procedure, User, ProcedureType } from '../../types';

export default function Procedures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newProc, setNewProc] = useState({ 
    clientName: '',
    idNumber: '',
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
    setLoading(true);
    try {
      // Use clientName as title if title is not provided
      const result = await api.createProcedure({
        clientName: newProc.clientName,
        idNumber: newProc.idNumber,
        procedureType: newProc.procedureType,
        title: `${newProc.procedureType} - ${newProc.clientName}`,
      });
      
      setShowNewModal(false);
      setNewProc({ 
        clientName: '',
        idNumber: '',
        procedureType: ''
      });
      
      const driveMsg = result.driveUrl 
        ? 'Se ha generado la carpeta en Google Drive.' 
        : 'No se pudo generar la carpeta automáticamente.';
      
      showSuccess(`Trámite creado exitosamente. ${driveMsg}`);
      await fetchProcedures();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filtered = procedures.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.clientUsername && p.clientUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.idNumber && p.idNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nuevo': return 'bg-blue-100 text-blue-800';
      case 'En Curso': return 'bg-yellow-100 text-yellow-800';
      case 'Finalizado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && procedures.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;
  }

  return (
    <div className="space-y-6 relative">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Trámites</h2>
          <p className="text-xs md:text-sm text-gray-500">Administre y realice el seguimiento de sus proyectos.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full sm:w-auto bg-[#E3000F] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-shadow shadow-lg hover:shadow-red-200 font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo Trámite
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-sm">{error}</div>}

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="p-3 md:p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Buscar trámite o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#E3000F] focus:border-[#E3000F] bg-white outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Proyecto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Drive</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((proc) => (
                <tr key={proc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-black text-[#E3000F] bg-red-50 px-2 py-1 rounded border border-red-100">
                      {proc.code || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/dashboard/procedures/${proc.id}`} className="flex items-center gap-3 group">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#E3000F]/10 transition-colors">
                        <FileText className="w-4 h-4 text-gray-600 group-hover:text-[#E3000F]" />
                      </div>
                      <div className="font-bold text-gray-900 group-hover:text-[#E3000F] transition-colors">{proc.title}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      {proc.clientName || proc.clientUsername || 'Sin nombre'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {proc.idNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {proc.technicianName || proc.technicianUsername || <span className="text-gray-400 italic">Sin asignar</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {proc.driveUrl ? (
                      <a href={proc.driveUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-xs">Carpeta</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Sin link</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx("px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full", getStatusColor(proc.status))}>
                      {proc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((proc) => (
            <div key={proc.id} className="p-3 space-y-2 hover:bg-gray-50 transition-colors">
              <Link to={`/dashboard/procedures/${proc.id}`} className="flex justify-between items-start gap-2 group">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-gray-100 rounded-lg shrink-0 group-hover:bg-[#E3000F]/10 transition-colors">
                    <FileText className="w-4 h-4 text-gray-600 group-hover:text-[#E3000F]" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-[#E3000F] bg-red-50 px-1 rounded border border-red-100">
                        {proc.code || '---'}
                      </span>
                      <h3 className="font-bold text-gray-900 text-[11px] leading-tight truncate group-hover:text-[#E3000F] transition-colors">{proc.title}</h3>
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase mt-0.5 truncate">{proc.procedureType || 'Trámite General'}</p>
                  </div>
                </div>
                <span className={clsx("px-2 py-0.5 text-[9px] font-bold rounded-full shrink-0", getStatusColor(proc.status))}>
                  {proc.status}
                </span>
              </Link>
              
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <UserIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[100px]">{proc.clientName || 'Sin nombre'}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[100px]">{proc.technicianName || proc.technicianUsername || 'Sin asignar'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-1">
                {proc.driveUrl ? (
                  <a href={proc.driveUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 text-[9px] font-bold">
                    <ExternalLink className="w-3 h-3" />
                    DRIVE
                  </a>
                ) : <div />}
                <div className="text-gray-400 text-[8px] italic">Toca el título para ver detalles</div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm">No se encontraron trámites que coincidan con su búsqueda.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Trámite */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-900 text-white">
              <h3 className="text-xl font-bold">Nuevo Trámite</h3>
              <p className="text-gray-400 text-sm mt-1">Inicie un nuevo proceso de construcción o legalización.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Dueño del Predio</label>
                  <input required type="text" value={newProc.clientName} onChange={e => setNewProc({...newProc, clientName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#E3000F] focus:border-transparent outline-none transition-all" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula del Propietario</label>
                  <input required type="text" value={newProc.idNumber} onChange={e => setNewProc({...newProc, idNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#E3000F] focus:border-transparent outline-none transition-all" placeholder="Número de cédula..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Trámite</label>
                  <select 
                    required
                    value={newProc.procedureType} 
                    onChange={e => setNewProc({...newProc, procedureType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#E3000F] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">Seleccionar Producto</option>
                    {procedureTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#E3000F] text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
