import { Link } from 'react-router-dom';
import { FileCheck, PenTool, Hammer } from 'lucide-react';

export default function Services() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <img 
                  src="https://lh3.googleusercontent.com/d/1nlBpfXAIZ5TwE9vMBBp_D1-mRz2HhJnb" 
                  alt="LEGARQ" 
                  className="h-12 md:h-16 w-auto"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <Link to="/" className="text-stone-500 text-xs font-black uppercase tracking-widest hover:text-[#E3000F] transition-colors">Inicio</Link>
              <Link to="/services" className="text-stone-900 text-xs font-black uppercase tracking-widest hover:text-[#E3000F] transition-colors">Servicios</Link>
              <Link to="/login" className="bg-[#1A1A1A] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E3000F] transition-all shadow-xl shadow-gray-200 active:scale-95">
                Acceso Sistema
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-[#1A1A1A] mb-6 tracking-tighter">Nuestros <span className="text-[#E3000F]">Servicios</span></h1>
          <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Ofrecemos soluciones integrales en arquitectura, desde la concepción del diseño hasta la legalización y construcción.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Legalización */}
          <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center group hover:shadow-xl transition-all">
            <div className="w-24 h-24 bg-stone-50 rounded-[24px] flex items-center justify-center shrink-0 border border-stone-100 group-hover:scale-110 transition-transform">
              <FileCheck className="w-12 h-12 text-[#E3000F]" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-6 tracking-tight">Legalización</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-600">
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#E3000F]" /> Trámites Municipales y Curadurías.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#E3000F]" /> Permisos de Construcción.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#E3000F]" /> Regularización de Obras.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#E3000F]" /> Propiedad Horizontal.</li>
              </ul>
            </div>
          </div>

          {/* Diseño */}
          <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center group hover:shadow-xl transition-all">
            <div className="w-24 h-24 bg-stone-50 rounded-[24px] flex items-center justify-center shrink-0 border border-stone-100 group-hover:scale-110 transition-transform">
              <PenTool className="w-12 h-12 text-[#C5B39A]" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-6 tracking-tight">Diseño</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-600">
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#C5B39A]" /> Diseño Residencial y Comercial.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#C5B39A]" /> Planos Urbanísticos.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#C5B39A]" /> Remodelaciones Integrales.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#C5B39A]" /> Modelado 3D y Renders.</li>
              </ul>
            </div>
          </div>

          {/* Construcción */}
          <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center group hover:shadow-xl transition-all">
            <div className="w-24 h-24 bg-stone-50 rounded-[24px] flex items-center justify-center shrink-0 border border-stone-100 group-hover:scale-110 transition-transform">
              <Hammer className="w-12 h-12 text-[#1A1A1A]" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-6 tracking-tight">Construcción</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-600">
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#1A1A1A]" /> Ejecución de Obra Nueva.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#1A1A1A]" /> Ampliaciones y Reformas.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#1A1A1A]" /> Mantenimiento Estructural.</li>
                <li className="flex items-center gap-3 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-[#1A1A1A]" /> Supervisión de Calidad.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
