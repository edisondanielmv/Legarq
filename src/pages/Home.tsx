import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Compass, HardHat, ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center justify-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
                  alt="LEGARQ" 
                  className="h-10 md:h-12 w-auto"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              <Link to="/" className="text-stone-900 text-xs font-black uppercase tracking-widest hover:text-[#E3000F] transition-colors">Inicio</Link>
              <Link to="/services" className="text-stone-500 text-xs font-black uppercase tracking-widest hover:text-[#E3000F] transition-colors">Servicios</Link>
              <Link to="/login" className="bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 active:scale-95">
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40 lg:py-56 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-black tracking-tighter mb-6 md:mb-8 leading-[0.9]"
          >
            LEGALIZACIÓN Y DISEÑO<br />
            <span className="text-[#E3000F]">ARQUITECTÓNICO</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-stone-300 max-w-2xl mb-10 md:mb-12 font-medium leading-relaxed"
          >
            Precisión. Innovación. Legalidad. Más de 15 años de experiencia creando espacios seguros y legales.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <Link to="/services" className="bg-[#E3000F] hover:bg-red-700 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 active:scale-95">
              Nuestros Servicios <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/consulta" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-white/20 active:scale-95">
              Consultar mi Trámite
            </Link>
          </motion.div>
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
    </div>
  );
}
