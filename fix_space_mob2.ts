import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Procedures.tsx', 'utf8');

const filterInpSrc = `<div className="relative flex-1 w-full flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[10px] sm:text-xs font-black text-gray-900 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:text-[8px] placeholder:tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 shrink-0 relative">
              <select
                value={procFilter}
                onChange={(e) => setProcFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border-transparent rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[10px] sm:text-xs font-black text-gray-900 appearance-none pr-8 cursor-pointer truncate"
                style={{ backgroundImage: "url(\\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '8px auto' }}
              >`;
const filterInpDst = `<div className="relative flex-1 w-full flex flex-col md:flex-row gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-[12px] sm:rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[10px] sm:text-xs font-black text-gray-900 placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:text-[8px] placeholder:tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 shrink-0 relative">
              <select
                value={procFilter}
                onChange={(e) => setProcFilter(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-[12px] sm:rounded-[18px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[9px] sm:text-[10px] font-black text-gray-900 appearance-none pr-7 cursor-pointer truncate"
                style={{ backgroundImage: "url(\\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '7px auto' }}
              >`;
content = content.replace(filterInpSrc, filterInpDst);

const pillSrc = `"px-2 px-2.5 sm:px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 border active:scale-95 group rounded-xl"`;
const pillDst = `"px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-1 border active:scale-95 group rounded-[8px] sm:rounded-xl"`;
content = content.replace(pillSrc, pillDst);

fs.writeFileSync('src/pages/dashboard/Procedures.tsx', content);

