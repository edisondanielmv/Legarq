import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ProcedureDetails.tsx', 'utf8');

const tSrc = `<div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E3000F]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Cliente</p>
                <p className="text-xs sm:text-sm font-black mt-1 truncate">{draft.client.name || 'Cargando...'}</p>
              </div>
            </div>`;
const tDst = `<div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center">
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[7px] sm:text-[8px] font-black text-sky-600/70 uppercase tracking-widest leading-none">Cliente</p>
                <p className="text-xs sm:text-sm font-black text-sky-700 mt-1 truncate">{draft.client.name || 'Cargando...'}</p>
              </div>
            </div>`;
                     
content = content.replace(tSrc, tDst);

fs.writeFileSync('src/pages/dashboard/ProcedureDetails.tsx', content);
