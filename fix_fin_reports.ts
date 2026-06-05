import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const desktopSrc = `<div className="space-y-1.5">
                                  {item.transactions.map((t: any) => (
                                    <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded-md p-1.5", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                      <div className="flex items-center gap-3">
                                        <span className={clsx(
                                          "w-2 h-2 rounded-full shrink-0",
                                          t.type === 'Ingreso' ? "bg-green-500" : t.type === 'Egreso' ? "bg-red-500" : "bg-amber-500"
                                        )}></span>
                                        <span className="font-bold text-gray-700 w-16 shrink-0">{t.date ? t.date.split('T')[0] : '---'}</span>
                                        <span className="text-gray-900 font-medium truncate max-w-[300px]">{t.description}</span>
                                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest shrink-0">{t.category}</span>
                                      </div>
                                      <div className="flex items-center gap-4 shrink-0">
                                        {t.registeredBy && <span className="text-gray-400 text-[8px] uppercase tracking-wider">Por: {t.registeredBy}</span>}
                                        <span className={clsx(
                                          "font-bold text-right w-20",
                                          t.type === 'Ingreso' ? "text-green-600" : t.type === 'Egreso' ? "text-red-600" : "text-amber-600"
                                        )}>
                                          {t.type === 'Egreso' ? '-' : ''}\${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>`;

const groupedTransactionsDesktopDst = `
                                {(() => {
                                  const groupTransactions = (typeList: string[], categoryList: string[] = []) => item.transactions.filter((t: any) => typeList.includes(t.type) || categoryList.includes(t.category));
                                  const renderGroup = (title: string, txs: any[], colorClass: string, dotClass: string) => txs.length > 0 && (
                                    <div className="mb-3 last:mb-0">
                                      <h5 className={clsx("text-[9px] font-bold uppercase tracking-widest mb-1.5 pl-1", colorClass)}>{title}</h5>
                                      <div className="space-y-1.5">
                                        {txs.map((t: any) => (
                                          <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex items-center justify-between text-[10px] bg-white border border-gray-100 rounded-md p-1.5", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                            <div className="flex items-center gap-3">
                                              <span className={clsx("w-2 h-2 rounded-full shrink-0", dotClass)}></span>
                                              <span className="font-bold text-gray-700 w-16 shrink-0">{t.date ? t.date.split('T')[0] : '---'}</span>
                                              <span className="text-gray-900 font-medium truncate max-w-[300px]">{t.description}</span>
                                              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest shrink-0">{t.category}</span>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                              {t.registeredBy && <span className="text-gray-400 text-[8px] uppercase tracking-wider">Por: {t.registeredBy}</span>}
                                              <span className={clsx("font-bold text-right w-20", colorClass)}>
                                                {t.type === 'Egreso' || t.type === 'Gasto' ? '-' : ''}\${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );

                                  const tAcordados = groupTransactions(['Cuenta por Cobrar'], ['Monto Acordado']);
                                  const tIngresos = groupTransactions(['Ingreso', 'Abono']);
                                  const tEgresos = groupTransactions(['Egreso', 'Gasto']);
                                  const tOtros = item.transactions.filter((t: any) => !tAcordados.includes(t) && !tIngresos.includes(t) && !tEgresos.includes(t));

                                  return (
                                    <div className="space-y-2">
                                      {renderGroup('Montos Acordados', tAcordados, 'text-blue-600', 'bg-blue-500')}
                                      {renderGroup('Ingresos', tIngresos, 'text-green-600', 'bg-green-500')}
                                      {renderGroup('Egresos', tEgresos, 'text-red-600', 'bg-red-500')}
                                      {renderGroup('Otros Movimientos', tOtros, 'text-amber-600', 'bg-amber-500')}
                                    </div>
                                  );
                                })()}`;

content = content.replace(desktopSrc, groupedTransactionsDesktopDst);

const mobileSrc = `<div className="space-y-1.5 pl-5">
                            {item.transactions.map((t: any) => (
                              <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex flex-col bg-white border border-gray-100 rounded-md p-2 space-y-1", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                                    <span className={clsx(
                                      "w-1.5 h-1.5 rounded-full shrink-0",
                                      t.type === 'Ingreso' ? "bg-green-500" : t.type === 'Egreso' ? "bg-red-500" : "bg-amber-500"
                                    )}></span>
                                    <span className="text-[10px] text-gray-900 font-bold truncate">{t.description}</span>
                                  </div>
                                  <span className={clsx(
                                    "font-black text-[10px] shrink-0",
                                    t.type === 'Ingreso' ? "text-green-600" : t.type === 'Egreso' ? "text-red-600" : "text-amber-600"
                                  )}>
                                    {t.type === 'Egreso' ? '-' : ''}\${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-wider pl-3">
                                  <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                                  {t.registeredBy && <span>Por: {t.registeredBy}</span>}
                                </div>
                              </div>
                            ))}
                          </div>`;

const mobileDst = `
                          <div className="pl-5">
                                {(() => {
                                  const groupTransactions = (typeList: string[], categoryList: string[] = []) => item.transactions.filter((t: any) => typeList.includes(t.type) || categoryList.includes(t.category));
                                  const renderGroup = (title: string, txs: any[], colorClass: string, dotClass: string) => txs.length > 0 && (
                                    <div className="mb-3 last:mb-0">
                                      <h5 className={clsx("text-[8px] font-bold uppercase tracking-widest mb-1.5", colorClass)}>{title}</h5>
                                      <div className="space-y-1.5">
                                        {txs.map((t: any) => (
                                          <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("flex flex-col bg-white border border-gray-100 rounded-md p-2 space-y-1", t.procedureId && "cursor-pointer hover:bg-gray-50 transition-colors")}>
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                                                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotClass)}></span>
                                                <span className="text-[10px] text-gray-900 font-bold truncate">{t.description}</span>
                                              </div>
                                              <span className={clsx("font-black text-[10px] shrink-0", colorClass)}>
                                                {t.type === 'Egreso' || t.type === 'Gasto' ? '-' : ''}\${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] font-bold text-gray-400 uppercase tracking-wider pl-3">
                                              <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                                              {t.registeredBy && <span className="truncate max-w-[80px]">Por: {t.registeredBy}</span>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );

                                  const tAcordados = groupTransactions(['Cuenta por Cobrar'], ['Monto Acordado']);
                                  const tIngresos = groupTransactions(['Ingreso', 'Abono']);
                                  const tEgresos = groupTransactions(['Egreso', 'Gasto']);
                                  const tOtros = item.transactions.filter((t: any) => !tAcordados.includes(t) && !tIngresos.includes(t) && !tEgresos.includes(t));

                                  return (
                                    <div className="space-y-2">
                                      {renderGroup('Montos Acordados', tAcordados, 'text-blue-600', 'bg-blue-500')}
                                      {renderGroup('Ingresos', tIngresos, 'text-green-600', 'bg-green-500')}
                                      {renderGroup('Egresos', tEgresos, 'text-red-600', 'bg-red-500')}
                                      {renderGroup('Otros', tOtros, 'text-amber-600', 'bg-amber-500')}
                                    </div>
                                  );
                                })()}
                          </div>`;

content = content.replace(mobileSrc, mobileDst);
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
