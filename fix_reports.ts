import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Reports.tsx', 'utf8');

if (!content.includes('MessageSquare, ')) {
    content = content.replace(
      "Search, Download, Filter }",
      "Search, Download, Filter, MessageSquare, X, RefreshCw }"
    );
}

// Add state
const stateToAdd = `  const [quickNoteModal, setQuickNoteModal] = useState<{ isOpen: boolean; procedureId: string; title: string }>({ isOpen: false, procedureId: '', title: '' });
  const [quickNoteText, setQuickNoteText] = useState('');
  const [saving, setSaving] = useState(false);
`;
if (!content.includes('quickNoteModal')) {
    content = content.replace("const viewMode =", stateToAdd + "  const viewMode =");
}

// Add handler
const handlerToAdd = `
  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim() || !quickNoteModal.procedureId) return;
    setSaving(true);
    try {
      await api.addLog({
        procedureId: quickNoteModal.procedureId,
        date: new Date().toISOString(),
        technicianUsername: user?.username,
        note: quickNoteText,
        isExternal: false
      });
      setQuickNoteModal({ isOpen: false, procedureId: '', title: '' });
      setQuickNoteText('');
      fetchReport(); // Reload data to show the new note
    } catch (err: any) {
      alert(\`Error al guardar la nota: \${err.message}\`);
    } finally {
      setSaving(false);
    }
  };
`;
if (!content.includes('handleSaveQuickNote')) {
    content = content.replace("const handleExportPDF", handlerToAdd + "\n  const handleExportPDF");
}

// Add Quick Note Modal JSX
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

if (!content.includes('Quick Note Modal')) {
    content = content.replace("return (", "return (\n    <>\n" + modalJSX);
    
    // Replace the final </div> ); } with </div></>\n);\n}
    let lastIndex = content.lastIndexOf("</div>");
    if (lastIndex !== -1) {
      let part1 = content.slice(0, lastIndex + 6);
      let part2 = content.slice(lastIndex + 6);
      content = part1 + '\n    </>' + part2;
    }
}

const oldFilter = `const hasActiveFilters = selectedTech !== 'all' || startDate || endDate;
                  if (hasActiveFilters) {
                    return procLogs.length > 0 && matchesSearch;
                  }`;

const newFilter = `// For tracking view, if tech is filtered, match procedure technician instead of only logs
                  if (selectedTech !== 'all' && p.technicianUsername !== selectedTech && p.technicianName !== selectedTech) {
                    return false;
                  }
                  return matchesSearch;`;

if (content.includes(oldFilter)) {
  content = content.replace(oldFilter, newFilter);
}

// Add the Actions column to tracking view table
const thOld1 = '<th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>';
const thNew1 = '<th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>\n                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>';

// Actually, maybe it occurs multiple times. Let's just find the one where the next line is </tr></thead>.
content = content.replace(/<th className="px-6 py-3 text-\[9px\] font-black text-gray-400 uppercase tracking-widest text-center">Ver<\/th>\s*<\/tr>/, '<th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>\n                  <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>\n                </tr>');

// Add the Ver/Action buttons in tbody
const trRegex = /<td className="px-6 py-3 text-center">\s*<a\s*href=\{\`\/dashboard\/procedures\/\$\{proc\.id\}\`\}\s*className="p-1\.5 text-gray-400 hover:text-\[#E3000F\] hover:bg-red-50 rounded-lg transition-all inline-block"\s*>\s*<FileText className="w-3\.5 h-3\.5" \/>\s*<\/a>\s*<\/td>/;

const newVerBtn = `<td className="px-6 py-3 text-center">
                        <a 
                          href={\`/dashboard/procedures/\${proc.id}\`}
                          className="p-1.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-all inline-block"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setQuickNoteModal({ isOpen: true, procedureId: proc.id, title: proc.title || proc.code || '' }); setQuickNoteText(''); }}
                          className="p-1.5 text-gray-400 hover:text-[#E3000F] hover:bg-red-50 rounded-lg transition-all inline-block"
                          title="Agregar nota"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>`;

content = content.replace(trRegex, newVerBtn);

// Also need to add column span
content = content.replace(/colSpan=\{7\}/g, "colSpan={8}");

fs.writeFileSync('src/pages/dashboard/Reports.tsx', content);
