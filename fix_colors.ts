import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Procedures.tsx', 'utf8');

// desktop client
const tdClientSrc = `<td className="px-3 py-2 whitespace-normal break-words">
                  <div className="flex flex-col min-w-0">
                    <div className="text-[11px] font-black text-gray-700 leading-tight">{proc.clientName || 'Sin nombre'}</div>
                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{proc.idNumber || 'N/A'}</div>
                  </div>
                </td>`;
const tdClientDst = `<td className="px-3 py-2 whitespace-normal break-words">
                  <div className="flex items-center gap-1.5">
                     <div className="w-6 h-6 bg-sky-50 rounded-md border border-sky-100 flex items-center justify-center shrink-0">
                        <UserIcon className="w-3 h-3 text-sky-500" />
                     </div>
                     <div className="flex flex-col min-w-0">
                       <div className="text-[10px] font-black text-sky-700 leading-tight truncate">{proc.clientName || 'Sin nombre'}</div>
                       <div className="text-[7.5px] font-black text-sky-600/70 uppercase tracking-widest mt-0.5">{proc.idNumber || 'N/A'}</div>
                     </div>
                  </div>
                </td>`;
content = content.replace(tdClientSrc, tdClientDst);

// mobile client
const mClientSrc = `{/* Cliente info */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                      <span className="text-[8px] font-black text-gray-700 truncate">{proc.clientName || 'Sin nombre'}</span>
                    </div>
                  </div>`;
const mClientDst = `{/* Cliente info */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center border border-sky-100 shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[6px] font-black text-sky-600/70 uppercase tracking-widest">Cliente</span>
                      <span className="text-[8px] font-black text-sky-700 truncate">{proc.clientName || 'Sin nombre'}</span>
                    </div>
                  </div>`;
content = content.replace(mClientSrc, mClientDst);

// mobile tech info
const mTechSrc = `{/* Técnico info */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Técnico</span>`;
const mTechDst = `{/* Técnico info */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[6px] font-black text-emerald-600/70 uppercase tracking-widest mb-0.5 lg:hidden">Técnico</span>`;
content = content.replace(mTechSrc, mTechDst);

fs.writeFileSync('src/pages/dashboard/Procedures.tsx', content);
