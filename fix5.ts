import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

// 1. Add state variable
content = content.replace(
  "const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');",
  "const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');\n  const [accountTypeFilter, setAccountTypeFilter] = useState('all');"
);

// 2. Add filter to categorySummary
const categorySummaryOld = `  const categorySummary = filteredTransactions.reduce((acc: any, t) => {
    const type = String(t.type || '').trim().toLowerCase();
    const isIncome = type === 'ingreso' || type === 'abono';
    const isExpense = type === 'egreso' || type === 'gasto';
    if (!isIncome && !isExpense) return acc;

    const cat = t.category || 'Sin Categoría';`;

const categorySummaryNew = `  const categorySummary = filteredTransactions.reduce((acc: any, t) => {
    const type = String(t.type || '').trim().toLowerCase();
    const isIncome = type === 'ingreso' || type === 'abono';
    const isExpense = type === 'egreso' || type === 'gasto';
    if (!isIncome && !isExpense) return acc;

    if (accountTypeFilter === 'Ingreso' && !isIncome) return acc;
    if (accountTypeFilter === 'Egreso' && !isExpense) return acc;

    const cat = t.category || 'Sin Categoría';`;

content = content.replace(categorySummaryOld, categorySummaryNew);

// 3. Add UI elements for accountTypeFilter
const searchInputOld = `<input
                type="text"
                placeholder="Filtrar transacciones por descripción, trámite o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>`;

const searchInputNew = `<input
                type="text"
                placeholder="Filtrar transacciones por descripción, trámite o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-[#E3000F] focus:border-[#E3000F] outline-none"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-[#E3000F] appearance-none cursor-pointer"
              >
                <option value="all">Todas las Cuentas</option>
                <option value="Ingreso">Cuentas de Ingreso</option>
                <option value="Egreso">Cuentas de Egreso</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>`;

content = content.replace(searchInputOld, searchInputNew);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
