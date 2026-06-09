import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Reports.tsx', 'utf8');

const tSrc = `<div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{proc.title}</h3>
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Cliente: {proc.clientName || 'N/A'}</p>
                  </div>`;
const tDst = `<div>
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">{proc.title}</h3>
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest truncate max-w-[150px] inline-block">
                        CL: {proc.clientName || 'N/A'}
                    </span>
                  </div>`;
                     
content = content.replace(tSrc, tDst);

fs.writeFileSync('src/pages/dashboard/Reports.tsx', content);
