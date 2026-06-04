import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/ProcedureDetails.tsx', 'utf8');

// Remove the add buttons:
const addBtnsOld = `<div className="flex gap-2">
                         <button onClick={() => addFinancialLocal('Ingreso')} className="h-8 px-3 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                            <Plus className="w-3 h-3" /> Abono
                         </button>
                         <button onClick={() => addFinancialLocal('Egreso')} className="h-8 px-3 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                            <Plus className="w-3 h-3" /> Gasto
                         </button>
                      </div>`;

content = content.replace(addBtnsOld, `<div className="flex gap-2">
  <button onClick={() => navigate('/dashboard/quick-finance', { state: { procedureId: procedure.id } })} className="h-8 px-3 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
    Ir a Caja Rápida <ArrowUpRight className="w-3 h-3" />
  </button>
</div>`);

// Make inputs read-only and remove delete button
const transactionsOld = `<div className="flex-1 grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-7">
                                <input 
                                  value={fin.description}
                                  onChange={e => {
                                    const newFins = [...draft.financials];
                                    newFins[idx].description = e.target.value;
                                    setDraft({...draft, financials: newFins});
                                  }}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-[10px] font-black text-gray-900 p-0 placeholder:text-gray-200"
                                  placeholder="Descripción..."
                                />
                                <div className="flex flex-wrap items-center mt-0.5 text-[7px] font-black text-gray-400 uppercase tracking-widest gap-2 leading-none">
                                   <span>{fin.category}</span>
                                   <span>•</span>
                                   <input
                                     type="date"
                                     value={fin.date ? fin.date.split('T')[0] : ''}
                                     onChange={e => {
                                       const newFins = [...draft.financials];
                                       newFins[idx].date = e.target.value ? new Date(e.target.value + "T12:00:00Z").toISOString() : '';
                                       setDraft({...draft, financials: newFins});
                                     }}
                                     className="bg-transparent border-none outline-none focus:ring-0 p-0 text-[8px] font-black w-[70px] text-gray-500 hover:text-gray-900 cursor-pointer -mt-0.5" 
                                   />
                                   {fin.registeredBy && (
                                     <>
                                       <span>•</span>
                                       <span>{fin.registeredBy}</span>
                                     </>
                                   )}
                                   {fin.createdAt && (
                                     <>
                                       <span>•</span>
                                       <span>{fin.createdAt.split('T')[0]}</span>
                                     </>
                                   )}
                                </div>
                              </div>
                              
                              <div className="col-span-4">
                                <div className="relative flex items-center justify-end bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                  <span className="text-gray-400 font-bold text-[10px] mr-1">$</span>
                                  <input 
                                    type="number"
                                    value={fin.amount || ''}
                                    onChange={e => {
                                      const newFins = [...draft.financials];
                                      newFins[idx].amount = Number(e.target.value);
                                      setDraft({...draft, financials: newFins});
                                    }}
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-[10px] font-black text-gray-900 p-0 text-right"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div className="col-span-1 flex justify-end">
                                 <button 
                                   onClick={() => {
                                     const newFins = [...draft.financials];
                                     if (newFins[idx].isNew) {
                                       newFins.splice(idx, 1);
                                     } else {
                                       newFins[idx].isDeleted = true;
                                     }
                                     setDraft({...draft, financials: newFins});
                                   }}
                                   className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                 >
                                    <span className="text-xs">&times;</span>
                                 </button>
                              </div>
                           </div>`;

const transactionsNew = `<div className="flex-1 grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-8">
                                <div className="w-full bg-transparent border-none outline-none text-[10px] font-black text-gray-900 p-0">
                                  {fin.description || 'Sin descripción'}
                                </div>
                                <div className="flex flex-wrap items-center mt-0.5 text-[7px] font-black text-gray-400 uppercase tracking-widest gap-2 leading-none">
                                   <span>{fin.category}</span>
                                   <span>•</span>
                                   <span>{fin.date ? fin.date.split('T')[0] : ''}</span>
                                   {fin.registeredBy && (
                                     <>
                                       <span>•</span>
                                       <span>{fin.registeredBy}</span>
                                     </>
                                   )}
                                   {fin.createdAt && (
                                     <>
                                       <span>•</span>
                                       <span>{fin.createdAt.split('T')[0]}</span>
                                     </>
                                   )}
                                </div>
                              </div>
                              
                              <div className="col-span-4">
                                <div className="relative flex items-center justify-end bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                  <span className="text-gray-400 font-bold text-[10px] mr-1">$</span>
                                  <div className="w-full bg-transparent border-none outline-none text-[10px] font-black text-gray-900 p-0 text-right">
                                    {Number(fin.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                           </div>`;

content = content.replace(transactionsOld, transactionsNew);

// Remove the warning about agreedAmount calculation being able to edit it, or keep it, since it's just stating the fact.

fs.writeFileSync('src/pages/dashboard/ProcedureDetails.tsx', content);
