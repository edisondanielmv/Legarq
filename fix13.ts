import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

// 1. Imports
if (!content.includes("import { jsPDF }")) {
  content = content.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { jsPDF } from 'jspdf';\nimport 'jspdf-autotable';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';\nimport { FileDown } from 'lucide-react';"
  );
}

// 2. Add PDF generation function
if (!content.includes("const generateMonthlyPDF")) {
  const funcToAdd = `
  const generateMonthlyPDF = (monthStr: string) => {
    const doc = new jsPDF();
    const monthName = format(new Date(monthStr + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es }).toUpperCase();
    
    // Add title
    doc.setFontSize(16);
    doc.text(\`REPORTE FINANCIERO MENSUAL - \${monthName}\`, 14, 20);
    
    // Filter transactions for this month
    const monthTransactions = filteredTransactions.filter(t => t.date && t.date.substring(0, 7) === monthStr);
    const incomes = monthTransactions.filter(t => {
       const type = String(t.type || '').trim().toLowerCase();
       return type === 'ingreso' || type === 'abono';
    });
    const expenses = monthTransactions.filter(t => {
       const type = String(t.type || '').trim().toLowerCase();
       return type === 'egreso' || type === 'gasto';
    });
    
    let y = 30;
    
    const incomeTotal = incomes.reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const expenseTotal = expenses.reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const netTotal = incomeTotal - expenseTotal;
    
    doc.setFontSize(10);
    doc.text(\`INGRESOS TOTALES: $\${incomeTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`EGRESOS TOTALES: $\${expenseTotal.toFixed(2)}\`, 14, y);
    y += 7;
    doc.text(\`FLUJO NETO: $\${netTotal.toFixed(2)}\`, 14, y);
    
    y += 15;
    doc.text('DETALLE DE INGRESOS', 14, y);
    
    const incomeData = incomes.map(t => [
       t.date ? t.date.split('T')[0] : '',
       t.description || '',
       t.category || '',
       \`\$\${parseAmount(t.amount).toFixed(2)}\`
    ]);
    
    (doc as any).autoTable({
       startY: y + 5,
       head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
       body: incomeData,
       theme: 'grid',
       headStyles: { fillColor: [34, 197, 94] }
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.text('DETALLE DE EGRESOS', 14, y);
    
    const expenseData = expenses.map(t => [
       t.date ? t.date.split('T')[0] : '',
       t.description || '',
       t.category || '',
       \`\$\${parseAmount(t.amount).toFixed(2)}\`
    ]);
    
    (doc as any).autoTable({
       startY: y + 5,
       head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
       body: expenseData,
       theme: 'grid',
       headStyles: { fillColor: [239, 68, 68] }
    });
    
    doc.save(\`reporte-financiero-\${monthStr}.pdf\`);
  };

  const chartData = [...cashFlowList].reverse().map((c: any) => ({
    name: format(new Date(c.month + '-01T12:00:00Z'), 'MMM yy', { locale: es }).toUpperCase(),
    Ingresos: c.income,
    Egresos: c.expense,
    'Flujo Neto': c.income - c.expense
  }));`;

  content = content.replace(
    "// Get unique transaction months",
    funcToAdd + "\n\n  // Get unique transaction months"
  );
}

// 3. Render Chart and Update Table
// Let's find: <div className="p-4 bg-gray-50 border-b border-gray-200">
//             <h3 className="text-sm font-bold text-gray-900 uppercase">Flujo de Caja Mensual</h3>
//           </div>

const oldCashflowHeader = `<div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Flujo de Caja Mensual</h3>
          </div>`;

const newCashflowHeader = `<div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Tendencia del Flujo de Caja</h3>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(value) => \`\$\${value}\`} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [\`\$\${value.toFixed(2)}\`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Ingresos" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase">Flujo de Caja Mensual</h3>
          </div>`;

content = content.replace(oldCashflowHeader, newCashflowHeader);

// Now the table rows. Add a new column to desktop
// The table header:
// <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
// </tr>

const desktopTrTableHeadOld = `<th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
                </tr>`;
const desktopTrTableHeadNew = `<th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tendencia</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>`;
content = content.replace(desktopTrTableHeadOld, desktopTrTableHeadNew);

// Desktop tr body old:
//                      </div>
//                    </td>
//                  </tr>

const desktopTrTableCellOld = `                      </div>
                    </td>
                  </tr>`;

const desktopTrTableCellNew = `                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); generateMonthlyPDF(item.month); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors" title="Descargar PDF">
                        <FileDown className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>`;

content = content.replace(desktopTrTableCellOld, desktopTrTableCellNew);

// Mobile view additions
const mobileRowOld = `<div className="flex justify-between items-center px-4 py-3 bg-gray-50/50">
                      <h4 className="text-xs font-bold text-gray-900 uppercase flex items-center gap-2">
                        {isPositive ? (
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">`;

const mobileRowNew = `<div className="flex justify-between items-center px-4 py-3 bg-gray-50/50">
                      <h4 className="text-xs font-bold text-gray-900 uppercase flex items-center gap-2">
                        {isPositive ? (
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">`;

const mobileRowButtonFind = `                      </h4>
                    </div>`;

const mobileRowButtonReplace = `                      </h4>
                      <button onClick={(e) => { e.stopPropagation(); generateMonthlyPDF(item.month); }} className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors" title="Descargar PDF">
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>`;

content = content.replace(mobileRowButtonFind, mobileRowButtonReplace);

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);

