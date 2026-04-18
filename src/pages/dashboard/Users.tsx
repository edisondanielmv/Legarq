import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Hourglass, User as UserIcon, Shield, Wrench, Phone, MapPin, Mail, Search, Trash2, Edit2, Key, CheckCircle2, Info } from 'lucide-react';
import { User } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';

const AVAILABLE_PERMISSIONS = [
  { id: 'procedures', label: 'Trámites' },
  { id: 'procedure_types', label: 'Tipos de Trámites' },
  { id: 'users', label: 'Usuarios' },
  { id: 'reports', label: 'Reporte de Actividades' },
  { id: 'finance', label: 'Reportes Financieros' },
  { id: 'settings', label: 'Configuración' },
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'tech', phone: '', address: '', idNumber: '', permissions: '[]', email: '' });
  const [editingUser, setEditingUser] = useState<(User & { password?: string }) | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers(currentUser?.role || '');
      setUsers(data);
    } catch (err: any) {
      if (err.message === 'SETUP_REQUIRED') navigate('/setup');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser({ ...newUser, requesterRole: currentUser?.role });
      setShowNewModal(false);
      setNewUser({ name: '', username: '', password: '', role: 'tech', phone: '', address: '', idNumber: '', permissions: '[]', email: '' });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const { password, ...userData } = editingUser;
      const updateData = password ? { ...userData, password } : userData;
      await api.updateUser(updateData);
      setShowEditModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (username: string) => {
    setSaving(true);
    try {
      await api.deleteUser(username);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (currentPermissions: string, permissionId: string): string => {
    try {
      let perms = JSON.parse(currentPermissions || '[]');
      if (perms.includes(permissionId)) {
        perms = perms.filter((p: string) => p !== permissionId);
      } else {
        perms.push(permissionId);
      }
      return JSON.stringify(perms);
    } catch (e) {
      return JSON.stringify([permissionId]);
    }
  };

  const hasPermission = (currentPermissions: string, permissionId: string): boolean => {
    try {
      const perms = JSON.parse(currentPermissions || '[]');
      return perms.includes('all') || perms.includes(permissionId);
    } catch (e) {
      return false;
    }
  };

  const filtered = users.filter(u => 
    u.role !== 'client' && (
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'tech': return <Wrench className="w-4 h-4 text-yellow-600" />;
      default: return <UserIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'tech': return 'Técnico';
      default: return 'Cliente';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Hourglass className="w-10 h-10 animate-pulse text-[#E3000F]" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando directorio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">
      {saving && <LoadingOverlay />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Directorio de Usuarios</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Gestión de personal y accesos del sistema</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#E3000F] transition-all shadow-lg active:scale-95 text-[9px] font-black uppercase tracking-widest"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-[24px] overflow-hidden border border-gray-100">
        <div className="p-3 md:p-4 border-b border-gray-50 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest border-transparent rounded-xl focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white outline-none bg-white border border-gray-100 placeholder:text-gray-300 transition-all"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-900 tracking-tight">{u.name}</div>
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID: {u.idNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <Mail className="w-3 h-3 text-[#E3000F]" /> {u.email || u.username}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <Phone className="w-3 h-3 text-[#E3000F]" /> {u.phone || 'S/N'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest max-w-[180px] truncate">
                      <MapPin className="w-3 h-3 text-[#E3000F]" /> {u.address || 'No registrada'}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg w-fit border border-gray-100">
                      {getRoleIcon(u.role)}
                      <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{getRoleName(u.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.username !== currentUser?.username && (
                        <button
                          onClick={() => setDeletingUser(u.username)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-50">
          {filtered.map((u) => (
            <div key={u.id} className="p-5 space-y-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-gray-900 text-sm tracking-tight truncate">{u.name}</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate">ID: {u.idNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                  {getRoleIcon(u.role)}
                  <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{getRoleName(u.role)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Mail className="w-3.5 h-3.5 text-[#E3000F] shrink-0" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{u.email || u.username}</span>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <Phone className="w-3.5 h-3.5 text-[#E3000F] shrink-0" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{u.phone || 'S/N'}</span>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  <MapPin className="w-3.5 h-3.5 text-[#E3000F] shrink-0" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{u.address || 'No registrada'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                {u.username !== currentUser?.username && (
                  <button
                    onClick={() => setDeletingUser(u.username)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-8 py-20 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Sin resultados</h3>
            <p className="text-gray-400 max-w-xs mx-auto text-[10px] font-black uppercase tracking-widest leading-relaxed">No se encontraron usuarios que coincidan con su búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="p-8 bg-[#1A1A1A] text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E3000F]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h3 className="text-2xl font-black tracking-tight relative z-10">Nuevo Registro</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 relative z-10">Complete los datos para el nuevo usuario</p>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Usuario</label>
                  <input required type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Correo Electrónico</label>
                  <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" placeholder="ejemplo@correo.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contraseña</label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teléfono</label>
                  <input type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cédula/ID</label>
                  <input type="text" value={newUser.idNumber} onChange={e => setNewUser({...newUser, idNumber: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dirección</label>
                  <input type="text" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rol en el Sistema</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all appearance-none">
                    <option value="tech">Técnico</option>
                    <option value="admin">Administrador</option>
                    <option value="finance">Finanzas</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Permisos de Acceso</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md group border border-gray-100">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={hasPermission(newUser.permissions, perm.id)}
                            onChange={() => setNewUser({...newUser, permissions: togglePermission(newUser.permissions, perm.id)})}
                            className="w-5 h-5 rounded-lg border-gray-200 text-[#E3000F] focus:ring-[#E3000F]/20 transition-all cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-8 py-4 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#E3000F] shadow-xl shadow-gray-200 transition-all flex items-center gap-3 active:scale-95">
                  {saving && <Hourglass className="w-4 h-4 animate-pulse text-white" />}
                  Registrar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="p-8 bg-[#1A1A1A] text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E3000F]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h3 className="text-2xl font-black tracking-tight relative z-10">Editar Usuario</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 relative z-10">Actualice la información de {editingUser.name}</p>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <input required type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Usuario (No editable)</label>
                  <input disabled type="text" value={editingUser.username} className="w-full bg-gray-100 border-gray-200 rounded-2xl p-4 text-gray-400 text-sm font-black tracking-tight cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Correo Electrónico</label>
                  <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teléfono</label>
                  <input type="text" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cédula/ID</label>
                  <input type="text" value={editingUser.idNumber || ''} onChange={e => setEditingUser({...editingUser, idNumber: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dirección</label>
                  <input type="text" value={editingUser.address || ''} onChange={e => setEditingUser({...editingUser, address: e.target.value})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rol en el Sistema</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all appearance-none">
                    <option value="tech">Técnico</option>
                    <option value="admin">Administrador</option>
                    <option value="finance">Finanzas</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Permisos de Acceso</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md group border border-gray-100">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={hasPermission(editingUser.permissions || '[]', perm.id)}
                            onChange={() => setEditingUser({...editingUser, permissions: togglePermission(editingUser.permissions || '[]', perm.id)})}
                            className="w-5 h-5 rounded-lg border-gray-200 text-[#E3000F] focus:ring-[#E3000F]/20 transition-all cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[#E3000F]" /> Nueva Contraseña (Opcional)
                  </label>
                  <input 
                    type="password" 
                    value={editingUser.password || ''} 
                    onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                    className="w-full bg-gray-50 border-transparent rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#E3000F]/20 focus:bg-white border text-sm font-black tracking-tight transition-all" 
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-8 py-4 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#E3000F] shadow-xl shadow-gray-200 transition-all flex items-center gap-3 active:scale-95">
                  {saving && <Hourglass className="w-4 h-4 animate-pulse text-white" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmar Eliminación */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6 bg-red-600 text-white text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold">¿Eliminar Usuario?</h3>
              <p className="text-red-100 text-sm mt-2">
                Esta acción eliminará permanentemente al usuario <span className="font-black">@{deletingUser}</span>.
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button 
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deletingUser)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {saving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
