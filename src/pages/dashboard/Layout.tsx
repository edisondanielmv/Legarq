import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, FileText, DollarSign, Settings, Menu, X } from 'lucide-react';
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
    { name: 'Tipos de Trámite', href: '/dashboard/procedure-types', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['admin'] },
    { name: 'Reportes Finanzas', href: '/dashboard/financial-reports', icon: DollarSign, roles: ['admin'] },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-stone-800">
        <Link to="/" className="text-2xl font-bold tracking-tighter" onClick={() => setIsMobileMenuOpen(false)}>
          LEGARQ<span className="text-[#E3000F]"> CONSTRUCTORA</span>
        </Link>
      </div>
      
      <div className="p-6">
        <div className="text-sm text-stone-400 mb-1">Bienvenido,</div>
        <div className="font-medium truncate">{user?.name}</div>
        <div className="text-xs text-[#C5B39A] mt-1 capitalize">{user?.role === 'tech' ? 'Técnico' : user?.role}</div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.filter(item => item.roles.includes(user?.role || '')).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                isActive ? 'bg-[#E3000F] text-white' : 'text-stone-300 hover:bg-stone-800 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-stone-300 rounded-md hover:bg-stone-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1A1A1A] text-white h-16 flex items-center justify-between px-4 z-50">
        <Link to="/" className="text-xl font-bold tracking-tighter">
          LEGARQ<span className="text-[#E3000F]"> CONSTRUCTORA</span>
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
        <header className="bg-white shadow-sm h-16 md:h-20 flex items-center px-4 md:px-8">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">
            Sistema de Gestión
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
