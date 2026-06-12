import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Procedures.tsx', 'utf8');

// 1. Add state for new filters
content = content.replace(
  "const [procFilter, setProcFilter] = useState('Todos');",
  "const [typeFilter, setTypeFilter] = useState('Todos');\n  const [techFilter, setTechFilter] = useState('Todos');"
);

// 2. Update filtering logic
content = content.replace(
  "const matchesProc = procFilter === 'Todos' || p.id === procFilter;\n    return matchesSearch && matchesStatus && matchesProc;",
  "const matchesType = typeFilter === 'Todos' || p.procedureType === typeFilter;\n    const matchesTech = techFilter === 'Todos' || (!p.technicianUsername && techFilter === 'Sin asignar') || p.technicianUsername === techFilter;\n    return matchesSearch && matchesStatus && matchesType && matchesTech;"
);

// 3. Extract unique types for type filter
const uniqueTypesLogic = `
  const uniqueTypes = Array.from(new Set(procedures.map(p => p.procedureType).filter(Boolean)));
  const uniqueTechs = Array.from(new Set(procedures.map(p => p.technicianUsername).filter(Boolean)));
`;

content = content.replace(
  "const getStatusColor",
  uniqueTypesLogic + "\n\n  const getStatusColor"
);

// 4. Update the Select Filters in UI
const oldSelect = `<div className="relative flex-1 sm:max-w-xs">
            <select
              value={procFilter}
              onChange={(e) => setProcFilter(e.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-[10px] sm:rounded-[14px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[9.5px] sm:text-[10px] font-black text-gray-900 appearance-none pr-7 cursor-pointer truncate"
              style={{ backgroundImage: "url(\\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '7px auto' }}
            >
              <option value="Todos">TIPO DE TRÁMITE</option>
              {procedures.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.clientName || p.clientUsername}</option>
              ))}
            </select>
          </div>`;

const newSelects = `<div className="relative flex-1 sm:max-w-[180px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-[10px] sm:rounded-[14px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[9.5px] sm:text-[10px] font-black text-gray-900 appearance-none pr-7 cursor-pointer truncate"
              style={{ backgroundImage: "url(\\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '7px auto' }}
            >
              <option value="Todos">TIPO DE TRÁMITE</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {user?.role === 'admin' && (
            <div className="relative flex-1 sm:max-w-[180px]">
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border-transparent rounded-[10px] sm:rounded-[14px] focus:ring-2 focus:ring-[#E3000F]/10 focus:bg-white border outline-none transition-all text-[9.5px] sm:text-[10px] font-black text-gray-900 appearance-none pr-7 cursor-pointer truncate"
                style={{ backgroundImage: "url(\\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '7px auto' }}
              >
                <option value="Todos">TÉCNICOS</option>
                <option value="Sin asignar">Sin asignar</option>
                {uniqueTechs.map(t => {
                  const techUser = users.find(u => u.username === t);
                  return <option key={t} value={t}>{techUser?.name || t}</option>;
                })}
              </select>
            </div>
          )}`;

if (content.includes(oldSelect)) {
    content = content.replace(oldSelect, newSelects);
    console.log("Updated Filters UI");
} else {
    console.log("oldSelect not found!");
}

fs.writeFileSync('src/pages/dashboard/Procedures.tsx', content);
