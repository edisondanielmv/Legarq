import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Loader2, User as UserIcon, Shield, Wrench, Phone, MapPin, Mail, Search } from 'lucide-react';
import { User } from '../../types';

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'client', phone: '', address: '', idNumber: '' });

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
    setLoading(true);
    try {
      await api.createUser({ ...newUser, requesterRole: currentUser?.role });
      setShowNewModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'client', phone: '', address: '', idNumber: '' });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#E3000F]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Directorio de Usuarios</h2>
          <p className="text-sm text-gray-500">Gestione el personal y los clientes de Legarq Constructora.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#E3000F] transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100">{error}</div>}

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">ID: {u.idNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" /> {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" /> {u.phone || 'S/N'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3 text-gray-400" /> {u.address || 'No registrada'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full w-fit border border-gray-100">
                      {getRoleIcon(u.role)}
                      <span className="text-xs font-bold text-gray-700">{getRoleName(u.role)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((u) => (
            <div key={u.id} className="p-3 space-y-2 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1.5 bg-gray-100 rounded-full shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 text-[11px] leading-tight truncate">{u.name}</h3>
                    <p className="text-[9px] text-gray-400 uppercase mt-0.5 truncate">ID: {u.idNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100 shrink-0">
                  {getRoleIcon(u.role)}
                  <span className="text-[9px] font-bold text-gray-700">{getRoleName(u.role)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate">{u.phone || 'S/N'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 overflow-hidden">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{u.address || 'No registrada'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm">No se encontraron usuarios que coincidan con su búsqueda.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-gray-900 text-white">
              <h3 className="text-xl font-bold">Nuevo Registro</h3>
              <p className="text-gray-400 text-sm mt-1">Complete los datos para el nuevo usuario o cliente.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                <input type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula/ID</label>
                <input type="text" value={newUser.idNumber} onChange={e => setNewUser({...newUser, idNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
                <input type="text" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol en el Sistema</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#E3000F]">
                  <option value="client">Cliente</option>
                  <option value="tech">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#E3000F] text-white font-bold rounded-lg hover:bg-red-700 shadow-lg transition-all">
                  {loading ? 'Guardando...' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
