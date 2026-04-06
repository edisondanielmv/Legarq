import { Link } from 'react-router-dom';
import { FileCheck, PenTool, Hammer } from 'lucide-react';

export default function Services() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="text-3xl font-bold tracking-tighter">
                LEGARQ<span className="text-[#E3000F]"> CONSTRUCTORA</span>
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-stone-600 font-medium hover:text-[#E3000F] transition-colors">Inicio</Link>
              <Link to="/services" className="text-stone-900 font-medium hover:text-[#E3000F] transition-colors">Servicios</Link>
              <Link to="/login" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-md font-medium hover:bg-[#E3000F] transition-colors">
                Acceso Sistema
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">Nuestros Servicios</h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Ofrecemos soluciones integrales en arquitectura, desde la concepción del diseño hasta la legalización y construcción.
          </p>
        </div>

        <div className="space-y-12">
          {/* Legalización */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
              <FileCheck className="w-12 h-12 text-[#E3000F]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Legalización</h2>
              <ul className="space-y-3 text-stone-600">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span> Trámites Municipales y Curadurías Urbanas.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span> Permisos de Construcción, Ampliación y Uso de Suelo.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span> Regularización de Obras Existentes y Linderos.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span> Constitución y Desenglobe de Propiedad Horizontal.</li>
              </ul>
            </div>
          </div>

          {/* Diseño */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
              <PenTool className="w-12 h-12 text-[#C5B39A]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Diseño</h2>
              <ul className="space-y-3 text-stone-600">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C5B39A]"></span> Diseño Arquitectónico Residencial, Comercial e Industrial.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C5B39A]"></span> Planos Urbanísticos, Implantación y Loteo.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C5B39A]"></span> Remodelaciones, Intervenciones y Rehabilitaciones.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C5B39A]"></span> Modelado 3D, Renders de Alta Calidad y Visualización VR.</li>
              </ul>
            </div>
          </div>

          {/* Construcción */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
              <Hammer className="w-12 h-12 text-[#1A1A1A]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Servicios de Construcción</h2>
              <ul className="space-y-3 text-stone-600">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></span> Ejecución de Obra Nueva Residencial y Comercial.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></span> Remodelaciones Integrales y Ampliaciones.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></span> Mantenimiento y Reparación de Estructuras.</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></span> Supervisión y Control de Calidad en Obra.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
