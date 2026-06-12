import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Reports.tsx', 'utf8');

// I need to find the `return (` that is for the main component, which is right after `const handleExportPDF = () => { ... };`
// I'll just use a regex to fix it. Wait, I inserted it there, let's remove it and put it where it belongs.

const modalJSX = `
      {/* Quick Note Modal */}
      {quickNoteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-[100dvh]">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E3000F]/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#E3000F]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Agregar Nota</h3>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 mt-0.5 line-clamp-1">{quickNoteModal.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickNoteModal({ isOpen: false, procedureId: '', title: '' })}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveQuickNote} className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Contenido de la nota (Interna)
                </label>
                <textarea
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Escriba aquí el seguimiento, anotación técnica..."
                  className="w-full h-32 px-4 py-3 bg-gray-50 border-transparent rounded-[14px] focus:bg-white focus:ring-2 focus:ring-[#E3000F]/10 focus:border-[#E3000F]/20 outline-none transition-all resize-none text-[13px] font-medium text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setQuickNoteModal({ isOpen: false, procedureId: '', title: '' })}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !quickNoteText.trim()}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-[#E3000F] text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Guardar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

// Remove the wrongly placed <>\n + modalJSX
content = content.replace("return (\n    <>\n" + modalJSX, "return (");

// find `  return (\n    <div className="space-y-6 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">`
const correctReturn = `  return (
    <div className="space-y-6 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">`;

content = content.replace(correctReturn, `  return (\n    <>\n` + modalJSX + `\n    <div className="space-y-6 max-w-6xl mx-auto relative font-sans selection:bg-[#E3000F] selection:text-white">`);

fs.writeFileSync('src/pages/dashboard/Reports.tsx', content);
