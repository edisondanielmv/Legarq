import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ReportNote.tsx', 'utf8');

const stateSrc = `  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');`;
const stateDst = `  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedId, setSelectedId] = useState<string>('');`;
content = content.replace(stateSrc, stateDst);

const filterSrc = `  // Filter list of procedures based on search
  const filteredProcedures = procedures.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(s) ||
      (p.title || '').toLowerCase().includes(s) ||
      (p.clientName || '').toLowerCase().includes(s) ||
      (p.procedureType || '').toLowerCase().includes(s)
    );
  });`;
const filterDst = `  // Filter list of procedures based on search
  const filteredProcedures = procedures.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (
      (p.code || '').toLowerCase().includes(s) ||
      (p.title || '').toLowerCase().includes(s) ||
      (p.clientName || '').toLowerCase().includes(s) ||
      (p.procedureType || '').toLowerCase().includes(s)
    );
    const statusVal = p.status === 'Completado' ? 'Finalizado' : p.status;
    const matchesStatus = statusFilter === 'Todos' || statusVal === statusFilter;
    return matchesSearch && matchesStatus;
  });`;
content = content.replace(filterSrc, filterDst);

const searchInputSrc = `            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar trámite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>`;
const searchInputDst = `            <div className="relative mb-2">
              <input 
                type="text" 
                placeholder="Buscar trámite..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black tracking-widest uppercase text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all mb-4"
            >
              <option value="Todos">TODOS LOS ESTADOS</option>
              <option value="En proceso">EN PROCESO</option>
              <option value="Suspendido">SUSPENDIDO</option>
              <option value="Finalizado">FINALIZADO</option>
            </select>`;
content = content.replace(searchInputSrc, searchInputDst);

const procInfoSrc = `                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block font-sans">Trámite Seleccionado</span>
                    <h3 className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#E3000F]" />
                      [{selectedProcedure.code}] {selectedProcedure.title}
                    </h3>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Propietario: {selectedProcedure.clientName} ({selectedProcedure.idNumber}) | Correo: {selectedProcedure.clientEmail || 'No registrado'}
                    </p>
                  </div>`;
const procInfoDst = `                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest block font-sans mb-1">Trámite Seleccionado</span>
                      <select 
                        value={selectedProcedure.status === 'Completado' ? 'Finalizado' : selectedProcedure.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as 'En proceso' | 'Suspendido' | 'Finalizado';
                          try {
                            await api.updateProcedure(selectedProcedure.id, { status: newStatus });
                            setProcedures(prev => prev.map(p => p.id === selectedProcedure.id ? { ...p, status: newStatus } : p));
                            setStatusMessage({ type: 'success', text: \`Estado actualizado a \${newStatus}\` });
                          } catch (err: any) {
                            setStatusMessage({ type: 'error', text: \`Error al actualizar estado: \${err.message}\` });
                          }
                        }}
                        className={\`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border outline-none cursor-pointer \${
                          (selectedProcedure.status === 'Finalizado' || selectedProcedure.status === 'Completado') 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' 
                            : selectedProcedure.status === 'Suspendido'
                              ? 'bg-rose-50 text-rose-600 border-rose-200/50' 
                              : 'bg-amber-50 text-amber-600 border-amber-200/50'
                        }\`}
                      >
                        <option value="En proceso">EN PROCESO</option>
                        <option value="Suspendido">SUSPENDIDO</option>
                        <option value="Finalizado">FINALIZADO</option>
                      </select>
                    </div>
                    <h3 className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#E3000F]" />
                      [{selectedProcedure.code}] {selectedProcedure.title}
                    </h3>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Propietario: {selectedProcedure.clientName} ({selectedProcedure.idNumber}) | Correo: {selectedProcedure.clientEmail || 'No registrado'}
                    </p>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Técnico Asignado: <span className="font-bold text-gray-700">{selectedProcedure.technicianName || selectedProcedure.technicianUsername || 'Sin asignar'}</span>
                    </p>
                  </div>`;
content = content.replace(procInfoSrc, procInfoDst);

fs.writeFileSync('src/pages/dashboard/ReportNote.tsx', content);
