import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ReportNote.tsx', 'utf8');

const tSrcBtn = `className={\`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 \${`;
const tDstBtn = `className={\`w-full text-left p-2.5 sm:p-3.5 rounded-xl border transition-all flex flex-col gap-1 sm:gap-1.5 \${`;
content = content.replace(tSrcBtn, tDstBtn);

const tSrcC = `                      <span className={\`font-mono text-[10px] font-black tracking-wider px-2 py-0.5 rounded \${`;
const tDstC = `                      <span className={\`font-mono text-[8.5px] sm:text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded \${`;
content = content.replace(tSrcC, tDstC);

const tSrcT = `<h4 className={\`text-xs font-black truncate max-w-full \${isSelected ? 'text-white' : 'text-gray-900'}\`}>`;
const tDstT = `<h4 className={\`text-[11px] sm:text-xs font-black truncate max-w-full \${isSelected ? 'text-white' : 'text-gray-900'}\`}>`;
content = content.replace(tSrcT, tDstT);

const tSrcM = `                        <div
                          key={p.id}
                          onMouseDown={(e) => {
                            // Use onMouseDown to prevent input blur before this fires
                            e.preventDefault();
                            setSelectedId(p.id);
                            setIsMobileSelectOpen(false);
                            setStatusMessage(null);
                          }}
                          className={\`p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 \${p.id === selectedId ? 'bg-red-50/50' : ''}\`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-[9px] font-black text-[#E3000F] px-1.5 py-0.5 bg-red-50 rounded border border-red-100 uppercase">{p.code}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{p.status}</span>
                          </div>
                          <h4 className="text-[11px] font-black text-gray-900 leading-tight">{p.title}</h4>
                          <p className="text-[8.5px] text-gray-500 mt-1 truncate">Cliente: {p.clientName}</p>
                        </div>`;
const tDstM = `                        <div
                          key={p.id}
                          onMouseDown={(e) => {
                            // Use onMouseDown to prevent input blur before this fires
                            e.preventDefault();
                            setSelectedId(p.id);
                            setIsMobileSelectOpen(false);
                            setStatusMessage(null);
                          }}
                          className={\`p-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 \${p.id === selectedId ? 'bg-red-50/50' : ''}\`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-[8px] font-black text-[#E3000F] px-1.5 py-0.5 bg-red-50 rounded border border-red-100 uppercase">{p.code}</span>
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-gray-500">{p.status}</span>
                          </div>
                          <h4 className="text-[10px] font-black text-gray-900 leading-tight mb-0.5">{p.title}</h4>
                          <p className="text-[8px] text-gray-500 truncate">Cliente: {p.clientName}</p>
                        </div>`;
content = content.replace(tSrcM, tDstM);

fs.writeFileSync('src/pages/dashboard/ReportNote.tsx', content);

