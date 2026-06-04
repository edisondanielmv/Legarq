import fs from 'fs';
let code = fs.readFileSync('src/pages/dashboard/FinancialReports.tsx', 'utf8');
code = code.replace(/\(t\.description \|\| ''\)\.toLowerCase\(\)/g, "String(t.description || '').toLowerCase()");
code = code.replace(/\(t\.category \|\| ''\)\.toLowerCase\(\)/g, "String(t.category || '').toLowerCase()");
code = code.replace(/\(t\.type \|\| ''\)\.trim\(\)\.toLowerCase\(\)/g, "String(t.type || '').trim().toLowerCase()");
code = code.replace(/\(data\.procedures\?\.find\(p => String\(p\.id\) === String\(t\.procedureId\)\)\?.title \|\| ''\)\.toLowerCase\(\)/g, "String(data.procedures?.find(p => String(p.id) === String(t.procedureId))?.title || '').toLowerCase()");
fs.writeFileSync('src/pages/dashboard/FinancialReports.tsx', code);
