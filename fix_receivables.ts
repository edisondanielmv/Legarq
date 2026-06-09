import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tSrc = `      {reportView === 'procedures' && (
        <>
          {/* Filters */}`;

const tDst = `      {reportView === 'receivables' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Trámite / Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto Acordado</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Ingresos</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Egresos</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Por Cobrar</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {procedureSummary
                  .filter(p => p.pending > 0.01)
                  .sort((a, b) => b.pending - a.pending)
                  .map(item => (
                    <tr key={item.procedureId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{item.title}</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{item.clientName || item.clientUsername || 'Sin cliente'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold text-gray-900">\${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold text-green-600">\${item.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold text-red-600">\${item.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold text-orange-600">\${item.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md bg-orange-50 text-orange-600 border border-orange-100 whitespace-nowrap">
                          {item.status || 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {procedureSummary.filter(p => p.pending > 0.01).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                        No hay cuentas por cobrar
                      </td>
                    </tr>
                  )}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td className="px-4 py-3 text-right font-black text-gray-900 text-[10px] uppercase tracking-widest">Totales</td>
                  <td className="px-4 py-3 text-right font-black text-gray-900 text-xs">
                    \${procedureSummary.filter(p => p.pending > 0.01).reduce((sum, p) => sum + p.totalValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-green-600 text-xs">
                    \${procedureSummary.filter(p => p.pending > 0.01).reduce((sum, p) => sum + p.totalIncome, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-red-600 text-xs">
                    \${procedureSummary.filter(p => p.pending > 0.01).reduce((sum, p) => sum + p.totalExpense, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-orange-600 text-xs">
                    \${procedureSummary.filter(p => p.pending > 0.01).reduce((sum, p) => sum + p.pending, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {reportView === 'procedures' && (
        <>
          {/* Filters */}`;

content = content.replace(tSrc, tDst);
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
