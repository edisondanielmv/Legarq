import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/QuickFinance.tsx', 'utf8');

// Imports
content = content.replace(
  "import { useAuth } from '../../contexts/AuthContext';",
  "import { useAuth } from '../../contexts/AuthContext';\nimport { useLocation, useNavigate } from 'react-router-dom';"
);

// Add location
content = content.replace(
  "export default function QuickFinance() {",
  "export default function QuickFinance() {\n  const location = useLocation();\n  const navigate = useNavigate();\n  const [handledEditId, setHandledEditId] = useState('');"
);

// Handle location state after loading
const initDataOld = `  useEffect(() => {
    fetchInitialData();
  }, []);`;

const initDataNew = `  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state?.procedureId && !selectedProcId) {
      setSelectedProcId(location.state.procedureId);
    }
  }, [location.state, selectedProcId]);
  
  useEffect(() => {
    if (location.state?.editFinancialItemId && procFinancials.length > 0 && handledEditId !== location.state.editFinancialItemId) {
      const target = procFinancials.find(f => f.id === location.state.editFinancialItemId);
      if (target) {
        setEditingItem(target);
        setHandledEditId(location.state.editFinancialItemId);
      }
    }
  }, [location.state, procFinancials, handledEditId]);`;

content = content.replace(initDataOld, initDataNew);

fs.writeFileSync('src/pages/dashboard/QuickFinance.tsx', content);
