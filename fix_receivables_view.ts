import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const tSrc = `      {reportView === 'receivables' && (
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
                        <span className={clsx(
                          "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md whitespace-nowrap",
                          item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700 border border-green-200" : 
                          item.totalIncome > 0 ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                        )}>
                          {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                           item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
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
      )}`;

const tDst = `      {reportView === 'receivables' && (
        <div className="space-y-6">
          {['En proceso', 'Suspendido', 'Finalizado', 'Otro'].map(statusGroup => {
            const groupProcedures = procedureSummary.filter(p => p.pending > 0.01 && (
              statusGroup === 'Otro' ? !['En proceso', 'Suspendido', 'Finalizado'].includes(p.status || '') : (p.status || (p.projectedProfit !== undefined ? 'En proceso' : 'Otro')) === statusGroup || (!p.status && statusGroup === 'En proceso')
            )).sort((a, b) => b.pending - a.pending);

            if (groupProcedures.length === 0) return null;

            const getStatusColor = (status: string) => {
              switch (status) {
                case 'En proceso': return 'bg-amber-50 text-amber-600 border-amber-100';
                case 'Suspendido': return 'bg-rose-50 text-rose-600 border-rose-100';
                case 'Finalizado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                default: return 'bg-gray-50 text-gray-600 border-gray-100';
              }
            };

            return (
              <div key={statusGroup} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{statusGroup}</h3>
                  <span className={clsx(
                    "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md border",
                    getStatusColor(statusGroup)
                  )}>
                    {groupProcedures.length} Trámites
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Trámite / Cliente</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Monto Acordado</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Ingresos</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Egresos</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Por Cobrar</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado de Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupProcedures.map(item => (
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
                            <span className={clsx(
                              "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md whitespace-nowrap",
                              item.pending <= 0 && item.totalValue > 0 ? "bg-green-100 text-green-700 border border-green-200" : 
                              item.totalIncome > 0 ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                            )}>
                              {item.pending <= 0 && item.totalValue > 0 ? 'Liquidado' : 
                               item.totalIncome > 0 ? 'Abonado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td className="px-4 py-3 text-right font-black text-gray-900 text-[10px] uppercase tracking-widest">Totales</td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 text-xs">
                          \${groupProcedures.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-green-600 text-xs">
                          \${groupProcedures.reduce((sum, p) => sum + p.totalIncome, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-red-600 text-xs">
                          \${groupProcedures.reduce((sum, p) => sum + p.totalExpense, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-orange-600 text-xs">
                          \${groupProcedures.reduce((sum, p) => sum + p.pending, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
          {procedureSummary.filter(p => p.pending > 0.01).length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <span className="text-gray-400 text-xs italic">No hay cuentas por cobrar</span>
            </div>
          )}
        </div>
      )}`;

if (!content.includes(tSrc)) {
  console.log("Not found.");
} else {
  content = content.replace(tSrc, tDst);
  fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
  console.log("Replaced!");
}
