import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const summaryStr = `
      {reportView === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="w-full sm:w-64">
                <select
                  value={transactionMonth}
                  onChange={(e) => setTransactionMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer"
                >
                  <option value="all">Todos los meses</option>
                  {cashFlowList.map((c: any) => (
                    <option key={c.month} value={c.month}>
                      {format(new Date(c.month + '-01T12:00:00Z'), 'MMMM yyyy', { locale: es })}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => {
                  let monthOpt = transactionMonth;
                  if (monthOpt === 'all' && cashFlowList.length > 0) {
                     monthOpt = cashFlowList[0].month;
                  }
                  if (monthOpt && monthOpt !== 'all') {
                    generateMonthlyPDF(monthOpt);
                  } else {
                    alert('No hay datos para generar el PDF');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Descargar Informe PDF
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-100">
              {(() => {
                if (transactionMonth === 'all') {
                  return (
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 uppercase text-center tracking-widest">Resumen Ejecutivo Global</h4>
                      <p className="mb-4 leading-relaxed tracking-wide">
                        Este informe abarca todos los registros financieros históricos disponibles en la plataforma. 
                        Durante este periodo total, se han registrado <strong>\${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> en ingresos totales, 
                        frente a <strong>\${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> en egresos operativos y administrativos.
                      </p>
                      <p className="mb-4 leading-relaxed tracking-wide">
                        El flujo neto global acumulado asciende a <strong>\${(totalIncome - totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>, 
                        lo cual representa el {totalIncome - totalExpense >= 0 ? "superávit" : "déficit"} total de todos los procesos gestionados. 
                        Este resultado engloba <strong>{filteredTransactions.length}</strong> operaciones registradas en el sistema.
                      </p>
                      <p className="text-xs text-gray-400 mt-8 text-center italic">Seleccione un mes específico en el menú desplegable para ver y descargar un informe detallado.</p>
                    </div>
                  );
                }

                const monthData = cashFlowSummary[transactionMonth];
                if (!monthData) {
                  return <p className="text-center italic text-gray-400">No hay datos financieros registrados para este periodo.</p>;
                }

                const d = new Date(transactionMonth + '-01T12:00:00Z');
                const monthName = format(d, 'MMMM', { locale: es });
                const yearName = format(d, 'yyyy');
                const net = monthData.income - monthData.expense;

                return (
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 uppercase text-center tracking-widest">Informe Financiero de {monthName} de {yearName}</h4>
                    <p className="mb-4 leading-relaxed tracking-wide">
                      Durante el mes de <strong>{monthName} de {yearName}</strong>, el desempeño financiero de las operaciones muestra que se generaron 
                      ingresos por un total de <strong>\${monthData.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>. Estos ingresos corresponden 
                      a los pagos y abonos registrados por los usuarios durante el periodo.
                    </p>
                    <p className="mb-4 leading-relaxed tracking-wide">
                      En paralelo, la estructura de egresos ascendió a <strong>\${monthData.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>, 
                      destinados a cubrir los gastos propios del área y devoluciones si corresponde. 
                    </p>
                    <p className="mb-4 leading-relaxed tracking-wide">
                      El balance neto para el ciclo se establece en <strong>\${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>, 
                      indicando un <strong>{net >= 0 ? "balance positivo" : "saldo negativo"}</strong> al cierre del mes de {monthName}.
                      Este comportamiento puede observarse a detalle en el módulo de Flujo para realizar proyecciones posteriores.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{/* Transaction Modal */}', summaryStr + '\n      {/* Transaction Modal */}');

fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
