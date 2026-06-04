import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ProcedureDetails.tsx', 'utf8');

content = content.replace(
  "const [activeTab, setActiveTab] = useState<'cliente' | 'tramite' | 'inmueble' | 'bitacora' | 'finanzas' | 'archivos'>('tramite');",
  "const [activeTab, setActiveTab] = useState<'cliente' | 'tramite' | 'inmueble' | 'bitacora' | 'archivos'>('tramite');"
);

fs.writeFileSync('src/pages/dashboard/ProcedureDetails.tsx', content);
