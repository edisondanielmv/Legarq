import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ReportNote.tsx', 'utf8');

const tSrc = `<p className="text-[9px] text-gray-500 font-medium">
                      Propietario: {selectedProcedure.clientName}
                    </p>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Técnico Asignado: <span className="font-bold text-gray-700">{selectedProcedure.technicianName || selectedProcedure.technicianUsername || 'Sin asignar'}</span>
                    </p>`;
const tDst = `<div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest truncate max-w-[150px]">
                        CL: {selectedProcedure.clientName || 'Sin propietario'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest truncate max-w-[150px]">
                        TÉC: {selectedProcedure.technicianName || selectedProcedure.technicianUsername || 'Sin técnico'}
                      </span>
                    </div>`;
                     
content = content.replace(tSrc, tDst);

fs.writeFileSync('src/pages/dashboard/ReportNote.tsx', content);
