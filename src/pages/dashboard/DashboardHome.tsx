import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, FileText, DollarSign, Settings, ClipboardList, Eye, Database, MessageSquare, Coins } from 'lucide-react';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Trámites', href: '/dashboard/procedures', icon: FileText, roles: ['admin', 'tech', 'client'], bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { name: 'Simular Consulta', href: '/consulta', icon: Eye, roles: ['admin', 'tech'], bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
    { name: 'Reportar Nota', href: '/dashboard/report-note', icon: MessageSquare, roles: ['admin', 'tech'], bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { name: 'Seguimiento', href: '/dashboard/reports?view=tracking', icon: ClipboardList, roles: ['admin'], bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
    { name: 'Tipos de Trámite', href: '/dashboard/procedure-types', icon: LayoutDashboard, roles: ['admin'], bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['admin'], bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { name: 'Reporte Actividades', href: '/dashboard/reports?view=list', icon: ClipboardList, roles: ['admin'], bgColor: 'bg-teal-50', iconColor: 'text-teal-500' },
    { name: 'Caja Rápida', href: '/dashboard/quick-finance', icon: Coins, roles: ['admin'], bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { name: 'Reportes Finanzas', href: '/dashboard/financial-reports', icon: DollarSign, roles: ['admin'], bgColor: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { name: 'Base de Datos', href: '/dashboard/database', icon: Database, roles: ['admin'], bgColor: 'bg-rose-50', iconColor: 'text-rose-500' },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['admin'], bgColor: 'bg-gray-100', iconColor: 'text-gray-600' },
  ];

  const hasPermission = (item: typeof navItems[0]) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Check role-based access
    if (item.roles.includes(user.role)) return true;
    
    // Check permission-based access
    try {
      const permissions = JSON.parse(user.permissions || '[]');
      if (permissions.includes('all')) return true;
      
      const permissionMap: Record<string, string> = {
        '/dashboard/procedure-types': 'procedure_types',
        '/dashboard/users': 'users',
        '/dashboard/reports': 'reports',
        '/dashboard/financial-reports': 'finance',
        '/dashboard/quick-finance': 'finance',
        '/dashboard/settings': 'settings'
      };
      
      // For query string hrefs, we need to match the base path
      const basePath = item.href.split('?')[0];
      const requiredPermission = permissionMap[basePath];
      if (requiredPermission && permissions.includes(requiredPermission)) return true;
    } catch (e) {
      console.error("Error parsing permissions", e);
    }
    
    return false;
  };

  const allowedItems = navItems.filter(hasPermission);

  // Determine user display label
  const roleLabel = user?.role === 'tech' ? 'Técnico' : 
                    user?.role === 'admin' ? 'Administrador' : 
                    user?.role === 'client' ? 'Cliente' : user?.role;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Hola, {user?.name?.split(' ')[0] || user?.username}</h1>
          <p className="text-[10px] sm:text-xs font-black text-gray-400 tracking-widest uppercase mt-1">Has iniciado sesión como {roleLabel}</p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shrink-0">
          <Users className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Quick Menu Grid */}
      <div>
        <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-1">¿Qué deseas hacer hoy?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {allowedItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className="bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all group"
            >
              <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-gray-900 leading-tight">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
