import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Compass, HardHat, ArrowRight, Code, Menu, X } from 'lucide-react';
import CodeModal from '../components/CodeModal';

export default function Home() {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl md:text-3xl font-bold tracking-tighter">
                  LEGARQ<span className="text-[#E3000F] hidden sm:inline"> CONSTRUCTORA</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-stone-900 font-medium hover:text-[#E3000F] transition-colors">Inicio</Link>
              <Link to="/services" className="text-stone-600 font-medium hover:text-[#E3000F] transition-colors">Servicios</Link>
              <button 
                onClick={() => setShowCodeModal(true)}
                className="text-stone-600 font-medium hover:text-[#E3000F] transition-colors flex items-center gap-1"
              >
                <Code className="w-4 h-4" />
                Código
              </button>
              <Link to="/login" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-md font-medium hover:bg-[#E3000F] transition-colors">
                Acceso Sistema
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Link 
                to="/login" 
                className="bg-[#1A1A1A] text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-[#E3000F] transition-all shadow-sm"
              >
                Acceso
              </Link>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-stone-600 hover:text-[#E3000F] p-1.5"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-stone-900 font-bold text-sm hover:text-[#E3000F]"
            >
              Inicio
            </Link>
            <Link 
              to="/services" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-stone-600 font-bold text-sm hover:text-[#E3000F]"
            >
              Servicios
            </Link>
            <button 
              onClick={() => {
                setShowCodeModal(true);
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-stone-600 font-bold text-sm hover:text-[#E3000F] flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Código Apps Script
            </button>
            <Link 
              to="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="block bg-[#1A1A1A] text-white px-4 py-3 rounded-lg font-bold text-center text-sm hover:bg-[#E3000F]"
            >
              Acceso Sistema
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-[#1A1A1A] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop"
            alt="Arquitectura"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 lg:py-48 text-center md:text-left">
          <h1 className="text-3xl md:text-6xl font-bold tracking-tight mb-4 md:mb-6">
            LEGALIZACIÓN Y DISEÑO<br />
            <span className="text-[#E3000F]">ARQUITECTÓNICO</span>
          </h1>
          <p className="text-base md:text-2xl text-stone-300 max-w-2xl mb-8 md:mb-10 font-light">
            Precisión. Innovación. Legalidad. Más de 15 años de experiencia creando espacios seguros.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
            <Link to="/services" className="bg-[#E3000F] hover:bg-red-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
              Nuestros Servicios <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            <Link to="/consulta" className="bg-white hover:bg-stone-100 text-[#1A1A1A] px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border border-stone-200">
              Consultar mi Trámite
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center p-6 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 text-[#E3000F]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4">Legalización</h3>
              <p className="text-sm md:text-base text-stone-600">Trámites municipales, permisos de construcción y regularización de obras existentes.</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <Compass className="w-6 h-6 md:w-8 md:h-8 text-[#C5B39A]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4">Diseño</h3>
              <p className="text-sm md:text-base text-stone-600">Diseño arquitectónico residencial y comercial. Modelado 3D y renders de alta calidad.</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                <HardHat className="w-6 h-6 md:w-8 md:h-8 text-[#1A1A1A]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4">Construcción</h3>
              <p className="text-sm md:text-base text-stone-600">Ejecución de obra nueva, remodelaciones integrales y supervisión de calidad.</p>
            </div>
          </div>
        </div>
      </div>

      <CodeModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} />
    </div>
  );
}
