import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');

const targetStr = `                    return list.map(t => (
                      <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("p-3 flex flex-col space-y-1.5 hover:bg-gray-50/50", t.procedureId && "cursor-pointer")}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-bold text-gray-900 leading-tight">{t.description}</span>
                          <span className={clsx(
                            "text-[11px] font-black shrink-0",
                            t.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                          )}>
                            {t.type === 'Egreso' ? '-' : ''}\${"" + Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                          <span className={clsx(
                             "px-1.5 py-0.5 rounded-sm text-[8px] tracking-widest",
                             t.type === 'Ingreso' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>{t.type}</span>
                        </div>
                        {t.registeredBy && (
                          <div className="text-[8px] text-gray-400 uppercase tracking-wider">Por: {t.registeredBy}</div>
                        )}
                      </div>
                    ));
                  })()}`;

const replStr = `                    return list.map(t => {
                      const proc = t.procedureId ? data.procedures.find(p => p.id === t.procedureId) : null;
                      return (
                      <div key={t.id} onClick={() => t.procedureId && navigate('/dashboard/quick-finance', { state: { procedureId: t.procedureId, editFinancialItemId: t.id } })} className={clsx("p-3 flex flex-col space-y-1.5 hover:bg-gray-50/50", t.procedureId && "cursor-pointer")}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-bold text-gray-900 leading-tight">{t.description}</span>
                          <span className={clsx(
                            "text-[11px] font-black shrink-0",
                            t.type === 'Ingreso' ? "text-green-600" : "text-red-600"
                          )}>
                            {t.type === 'Egreso' ? '-' : ''}\${"" + Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {proc && (
                          <div className="flex flex-col gap-0.5 bg-gray-50 p-1.5 rounded-md border border-gray-100 mt-1.5 mb-1.5">
                            <span className="text-[10px] font-bold text-gray-900">{proc.code}</span>
                            <span className="text-[9px] text-gray-500 truncate">{proc.clientName}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          <span>{t.date ? t.date.split('T')[0] : '---'} • {t.category}</span>
                          <span className={clsx(
                             "px-1.5 py-0.5 rounded-sm text-[8px] tracking-widest",
                             t.type === 'Ingreso' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>{t.type}</span>
                        </div>
                        {t.registeredBy && (
                          <div className="text-[8px] text-gray-400 uppercase tracking-wider">Por: {t.registeredBy}</div>
                        )}
                      </div>
                    );
                  })()}`;

const originalRegex = /return list\.map\(t => \([\s\S]*?\)\);\s*}\)\(\)}/;

content = content.replace(originalRegex, replStr);
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', content);
