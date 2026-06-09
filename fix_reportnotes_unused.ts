import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ReportNote.tsx', 'utf8');

const tSrc = `  const [isExternal, setIsExternal] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  
  const [logs, setLogs] = useState<ProcedureLog[]>([]);`;
const tDst = `  const [isExternal, setIsExternal] = useState(false);
  
  const [logs, setLogs] = useState<ProcedureLog[]>([]);`;
content = content.replace(tSrc, tDst);

fs.writeFileSync('src/pages/dashboard/ReportNote.tsx', content);

