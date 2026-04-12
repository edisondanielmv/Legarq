import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, FileText, DollarSign, Settings, Menu, X, ClipboardList, Eye } from 'lucide-react';
import clsx from 'clsx';
import { APPS_SCRIPT_URL } from '../../lib/api';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Trámites', href: '/dashboard', icon: FileText, roles: ['admin', 'tech', 'client'] },
    { name: 'Simular Consulta', href: '/consulta', icon: Eye, roles: ['admin', 'tech'] },
    { name: 'Tipos de Trámite', href: '/dashboard/procedure-types', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['admin'] },
    { name: 'Reporte Actividades', href: '/dashboard/reports', icon: ClipboardList, roles: ['admin'] },
    { name: 'Reportes Finanzas', href: '/dashboard/financial-reports', icon: DollarSign, roles: ['admin'] },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
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
        '/dashboard/settings': 'settings'
      };
      
      const requiredPermission = permissionMap[item.href];
      if (requiredPermission && permissions.includes(requiredPermission)) return true;
    } catch (e) {
      console.error("Error parsing permissions", e);
    }
    
    return false;
  };

  const SidebarContent = () => (
    <>
      <div className="h-24 flex items-center px-6 border-b border-stone-800">
        <Link to="/" className="flex items-center justify-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
          <img 
            src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
            alt="LEGARQ" 
            className="h-16 w-auto"
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>
      
      <div className="p-6">
        <div className="text-sm text-stone-400 mb-1">Bienvenido,</div>
        <div className="font-medium truncate">{user?.name}</div>
        <div className="text-xs text-[#C5B39A] mt-1 capitalize">
          {user?.role === 'tech' ? 'Técnico' : 
           user?.role === 'admin' ? 'Administrador' : 
           user?.role === 'finance' ? 'Finanzas' : user?.role}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.filter(hasPermission).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                isActive 
                  ? 'bg-[#E3000F] text-white shadow-lg shadow-red-900/20' 
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-white',
                'group flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95'
              )}
            >
              <item.icon className={clsx(
                "mr-3 flex-shrink-0 h-4 w-4 transition-colors",
                isActive ? "text-white" : "text-stone-500 group-hover:text-[#E3000F]"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-stone-800/50">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-stone-400 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1A1A1A] text-white h-16 flex items-center justify-between px-4 z-50">
        <Link to="/" className="flex items-center justify-center">
          <img 
            src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
            alt="LEGARQ" 
            className="h-10 w-auto"
            referrerPolicy="no-referrer"
          />
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!APPS_SCRIPT_URL && (
          <div className="bg-amber-500 text-white text-center py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest">
            Modo Demostración - Datos no guardados en Google Sheets
          </div>
        )}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 md:h-20 flex items-center px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#E3000F] rounded-full hidden md:block" />
            <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">
              Sistema de <span className="text-[#E3000F]">Gestión</span>
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FDFDFD]">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
